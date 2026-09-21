import { canonicalArticleUrl, nextCrawlInfo } from "../shared/article-intake.mjs";

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
    },
  });
}

function allowedOrigin(request, env) {
  const origin = request.headers.get("origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "https://r4ph426.github.io,http://localhost:5173")
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

async function incrementBucket(kv, key, ttl) {
  const current = Number(await kv.get(key)) || 0;
  const next = current + 1;
  await kv.put(key, String(next), { expirationTtl: ttl });
  return next;
}

async function enforceRateLimit(request, env, clientId) {
  if (!env.SUBMISSION_KV) return { allowed: false, configurationError: true };
  const now = new Date();
  const hourBucket = now.toISOString().slice(0, 13);
  const dayBucket = now.toISOString().slice(0, 10);
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const [clientHash, networkHash] = await Promise.all([digest(clientId), digest(ip)]);
  const [clientCount, networkCount] = await Promise.all([
    incrementBucket(env.SUBMISSION_KV, `rate:client:${clientHash}:${hourBucket}`, 7_200),
    incrementBucket(env.SUBMISSION_KV, `rate:network:${networkHash}:${dayBucket}`, 172_800),
  ]);
  if (clientCount > 5) return { allowed: false, retryAfterMinutes: 60 };
  if (networkCount > 50) return { allowed: false, retryAfterMinutes: 24 * 60 };
  return { allowed: true };
}

async function verifyTurnstile(token, env) {
  if (env.ALLOW_UNVERIFIED_SUBMISSIONS === "true") return true;
  if (!env.TURNSTILE_SECRET || !token) return false;
  const requestFetch = env.FETCH || fetch;
  const body = new FormData();
  body.set("secret", env.TURNSTILE_SECRET);
  body.set("response", token);
  const response = await requestFetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true;
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
    const response = await requestFetch(`https://api.github.com/repos/${repository}/issues?state=all&per_page=100&page=${page}`, { headers });
    if (!response.ok) throw new Error(`GitHub duplicate check failed with ${response.status}`);
    const issues = await response.json();
    const duplicate = issues.find((issue) => !issue.pull_request && issueArticleUrl(issue) === url);
    if (duplicate) return duplicate;
    if (issues.length < 100) return null;
  }
  return null;
}

async function createIssue(url, crawl, env) {
  const requestFetch = env.FETCH || fetch;
  const repository = env.GITHUB_REPOSITORY || "r4ph426/design-daily";
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  const response = await requestFetch(`https://api.github.com/repos/${repository}/issues`, {
    method: "POST",
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
  if (!env.GITHUB_TOKEN || !env.SUBMISSION_KV) {
    return json({ status: "error", message: "Article submission is temporarily unavailable." }, 503, origin);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ status: "invalid_url", message: "Paste a valid public article URL." }, 400, origin);
  }

  if (payload.website) return json({ status: "accepted" }, 202, origin);
  const url = canonicalArticleUrl(payload.url || "");
  if (!url) return json({ status: "invalid_url", message: "Paste a valid public article URL." }, 400, origin);
  if (!(await verifyTurnstile(payload.turnstileToken || "", env))) {
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
    return handleSubmission(request, env, origin);
  },
};
