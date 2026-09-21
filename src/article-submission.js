import { canonicalArticleUrl, nextCrawlInfo } from "../shared/article-intake.mjs";

const endpoint = import.meta.env.VITE_ARTICLE_SUBMISSION_ENDPOINT || "";
const mockKey = "design-daily:mock-submissions";

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function getMockSubmissions() {
  try {
    return JSON.parse(window.localStorage.getItem(mockKey) || "{}");
  } catch {
    return {};
  }
}

async function mockSubmit(rawUrl) {
  await wait(650);
  const url = canonicalArticleUrl(rawUrl);
  const submissions = getMockSubmissions();
  const previous = submissions[url];
  if (previous) {
    return {
      status: previous.status === "processed" ? "duplicate_history" : "duplicate_queued",
      url,
      hostname: new URL(url).hostname.replace(/^www\./, ""),
      crawl: previous.crawl,
      previousCrawlDate: previous.crawl?.displayDate,
    };
  }

  const crawl = nextCrawlInfo();
  submissions[url] = { status: "queued", crawl, submittedAt: new Date().toISOString() };
  window.localStorage.setItem(mockKey, JSON.stringify(submissions));
  return { status: "accepted", url, hostname: new URL(url).hostname.replace(/^www\./, ""), crawl };
}

export function articleSubmissionEndpointConfigured() {
  return Boolean(endpoint) || import.meta.env.DEV;
}

export async function submitArticle({ url, clientId, turnstileToken = "", website = "" }) {
  if (!endpoint && import.meta.env.DEV) return mockSubmit(url);
  if (!endpoint) throw new Error("Article submission is not configured yet.");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url, clientId, turnstileToken, website }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok && !payload.status) {
    throw new Error(payload.message || "We couldn’t add this link. Nothing was submitted.");
  }
  return payload;
}

export function getSubmissionClientId() {
  const key = "design-daily:submission-client";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(key, id);
  }
  return id;
}

export function clearMockArticleSubmissions() {
  if (import.meta.env.DEV) window.localStorage.removeItem(mockKey);
}
