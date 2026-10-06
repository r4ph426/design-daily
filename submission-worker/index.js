import { canonicalArticleUrl, nextCrawlInfo } from "../shared/article-intake.mjs";
export { SubmissionRateLimit } from "./rate-limit.js";

const userAgent = "design-daily-article-intake/1.0";

function json(body, status = 200, origin = "*") {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      vary: "Origin",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function allowedOrigin(request, env) {
  const origin = request.headers.get("origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "https://r4ph426.github.io")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return allowed.includes(origin) ? origin : "";
}

async function digest(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

async function reserveBucket(binding, key, limit, expiresAt) {
  const stub = binding.get(binding.idFromName(key));
  const response = await stub.fetch("https://rate-limit/reserve", {
    method: "POST", body: JSON.stringify({ limit, expiresAt }),
  });
  if (!response.ok) throw new Error("Submission quota unavailable");
  return (await response.json()).allowed === true;
}

async function enforceRateLimit(request, env, clientId) {
  if (!env.SUBMISSION_RATE_LIMIT) return { allowed: false, configurationError: true };
  const now = new Date();
  const hourBucket = now.toISOString().slice(0, 13);
  const dayBucket = now.toISOString().slice(0, 10);
  const ip = request.headers.get("cf-connecting-ip");
  if (!ip) return { allowed: false, configurationError: true };
  const [clientHash, networkHash] = await Promise.all([digest(clientId), digest(ip)]);
  if (!(await reserveBucket(env.SUBMISSION_RATE_LIMIT, `client:${clientHash}:${hourBucket}`, 5, now.getTime() + 7_200_000))) return { allowed: false, retryAfterMinutes: 60 };
  if (!(await reserveBucket(env.SUBMISSION_RATE_LIMIT, `network:${networkHash}:${dayBucket}`, 50, now.getTime() + 172_800_000))) return { allowed: false, retryAfterMinutes: 24 * 60 };
  return { allowed: true };
}

async function verifyTurnstile(token, env, origin, ip) {
  if (!env.TURNSTILE_SECRET || !token) return false;
  const requestFetch = env.FETCH || fetch;
  const body = new FormData();
  body.set("secret", env.TURNSTILE_SECRET);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);
  const response = await requestFetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    signal: AbortSignal.timeout(10_000),
    redirect: "manual",
  });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true && result.hostname === new URL(origin).hostname;
}

function issueArticleUrl(issue) {
  const match = `${issue.title || ""}\n${issue.body || ""}`.match(/https?:\/\/[^\s<>)]+/i);
  return match ? canonicalArticleUrl(match[0]) : "";
}

function displayCrawlDate(value) {
  if (!value) return "a previous crawl";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "a previous crawl";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "Europe/Berlin" }).format(date);
}

async function findDuplicate(url, env) {
  const requestFetch = env.FETCH || fetch;
  const repository = env.GITHUB_REPOSITORY || "r4ph426/design-daily";
  const headers = {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "user-agent": userAgent,
    "x-github-api-version": "2022-11-28",
  };

  for (let page = 1; page <= 20; page += 1) {
    const response = await requestFetch(`https://api.github.com/repos/${repository}/issues?state=all&per_page=100&page=${page}`, { headers, signal: AbortSignal.timeout(10_000), redirect: "manual" });
    if (!response.ok) throw new Error(`GitHub duplicate check failed with ${response.status}`);
    const issues = await response.json();
    const duplicate = issues.find((issue) => !issue.pull_request && issueArticleUrl(issue) === url);
    if (duplicate) return duplicate;
    if (issues.length < 100) return null;
  }
  throw new Error("Duplicate history exceeds the scan limit");
}

async function createIssue(url, crawl, env) {
  const requestFetch = env.FETCH || fetch;
  const repository = env.GITHUB_REPOSITORY || "r4ph426/design-daily";
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  const response = await requestFetch(`https://api.github.com/repos/${repository}/issues`, {
    method: "POST",
    signal: AbortSignal.timeout(10_000),
    redirect: "manual",
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "content-type": "application/json",
      "user-agent": userAgent,
      "x-github-api-version": "2022-11-28",
    },
    body: JSON.stringify({
      title: `Shared article: ${hostname}`,
      body: `Article URL: ${url}\n\nSubmitted anonymously from design / daily.\nNext crawl: ${crawl.date}.`,
    }),
  });
  if (!response.ok) throw new Error(`GitHub issue creation failed with ${response.status}`);
  return response.json();
}

async function handleSubmission(request, env, origin) {
  if (!env.GITHUB_TOKEN || !env.SUBMISSION_RATE_LIMIT || !env.TURNSTILE_SECRET) {
    return json({ status: "error", message: "Article submission is temporarily unavailable." }, 503, origin);
  }

  let payload;
  try {
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) {
      return json({ status: "invalid_request", message: "Send a JSON contribution." }, 415, origin);
    }
    const maxBytes = 16_384;
    if (Number(request.headers.get("content-length")) > maxBytes) return json({ status: "invalid_request", message: "Contribution is too large." }, 413, origin);
    const reader = request.body?.getReader();
    const chunks = [];
    let size = 0;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
          await reader.cancel();
          return json({ status: "invalid_request", message: "Contribution is too large." }, 413, origin);
        }
        chunks.push(value);
      }
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    payload = JSON.parse(new TextDecoder().decode(bytes));
    if (!payload || typeof payload !== "object" || Array.isArray(payload)
      || typeof payload.url !== "string" || payload.url.length > 8192
      || ["clientId", "turnstileToken", "website"].some((key) => payload[key] !== undefined && typeof payload[key] !== "string")
      || (payload.turnstileToken?.length || 0) > 2048) throw new Error("Invalid payload");
  } catch {
    return json({ status: "invalid_url", message: "Paste a valid public article URL." }, 400, origin);
  }

  if (payload.website) return json({ status: "accepted" }, 202, origin);
  const url = canonicalArticleUrl(payload.url || "");
  if (!url) return json({ status: "invalid_url", message: "Paste a valid public article URL." }, 400, origin);
  if (!(await verifyTurnstile(payload.turnstileToken || "", env, origin, request.headers.get("cf-connecting-ip")))) {
    return json({ status: "verification_required", message: "We couldn’t verify this submission. Please try again." }, 400, origin);
  }

  const clientId = typeof payload.clientId === "string" && payload.clientId.length >= 8
    ? payload.clientId.slice(0, 128)
    : "anonymous-client";
  const limit = await enforceRateLimit(request, env, clientId);
  if (!limit.allowed) {
    return json({
      status: limit.configurationError ? "error" : "rate_limited",
      message: limit.configurationError ? "Article submission is temporarily unavailable." : "You’ve reached the sharing limit.",
      retryAfterMinutes: limit.retryAfterMinutes,
    }, limit.configurationError ? 503 : 429, origin);
  }

  try {
    const duplicate = await findDuplicate(url, env);
    if (duplicate) {
      const crawl = nextCrawlInfo();
      const hostname = new URL(url).hostname.replace(/^www\./, "");
      if (duplicate.state === "open") {
        return json({ status: "duplicate_queued", url, hostname, crawl }, 409, origin);
      }
      return json({
        status: "duplicate_history",
        url,
        hostname,
        previousCrawlDate: displayCrawlDate(duplicate.closed_at),
      }, 409, origin);
    }

    const crawl = nextCrawlInfo();
    const issue = await createIssue(url, crawl, env);
    return json({
      status: "accepted",
      url,
      hostname: new URL(url).hostname.replace(/^www\./, ""),
      crawl,
      submissionId: issue.number,
    }, 201, origin);
  } catch (error) {
    console.error(error);
    return json({ status: "error", message: "We couldn’t add this link. Nothing was submitted." }, 502, origin);
  }
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);
    if (!origin) return json({ status: "forbidden", message: "Origin not allowed." }, 403, "null");
    if (request.method === "OPTIONS") return json({}, 204, origin);
    if (request.method !== "POST") return json({ status: "method_not_allowed" }, 405, origin);
    try { return await handleSubmission(request, env, origin); }
    catch {
      return json({ status: "error", message: "Article submission is temporarily unavailable." }, 503, origin);
    }
  },
};
