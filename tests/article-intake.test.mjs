import test from "node:test";
import assert from "node:assert/strict";
import worker from "../submission-worker/index.js";
import { canonicalArticleUrl, nextCrawlInfo } from "../shared/article-intake.mjs";

class MemoryKv {
  values = new Map();
  async get(key) { return this.values.get(key) ?? null; }
  async put(key, value) { this.values.set(key, value); }
}

function request(body, ip = "203.0.113.8") {
  return new Request("https://intake.example.com/submit", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:5173",
      "cf-connecting-ip": ip,
    },
    body: JSON.stringify(body),
  });
}

function envWithIssues(issues = []) {
  const calls = [];
  const mockFetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("/issues?")) {
      const page = Number(new URL(url).searchParams.get("page") || 1);
      const result = Array.isArray(issues[0]) ? (issues[page - 1] || []) : issues;
      return Response.json(result);
    }
    if (String(url).endsWith("/issues") && options.method === "POST") return Response.json({ number: 42 }, { status: 201 });
    throw new Error(`Unexpected request: ${url}`);
  };
  return {
    ALLOWED_ORIGINS: "http://localhost:5173",
    ALLOW_UNVERIFIED_SUBMISSIONS: "true",
    GITHUB_TOKEN: "test-token",
    SUBMISSION_KV: new MemoryKv(),
    FETCH: mockFetch,
    calls,
  };
}

test("canonicalArticleUrl removes tracking and rejects private URLs", () => {
  assert.equal(canonicalArticleUrl("https://Example.com/story/?utm_source=x&b=2#a"), "https://example.com/story?b=2");
  assert.equal(canonicalArticleUrl("www.abc-article.com/story"), "https://abc-article.com/story");
  assert.equal(canonicalArticleUrl("abc-article.com/story"), "https://abc-article.com/story");
  assert.equal(canonicalArticleUrl("fcb.com/story"), "https://fcb.com/story");
  assert.equal(canonicalArticleUrl("fd.design/story"), "https://fd.design/story");
  assert.equal(canonicalArticleUrl("http://[fd00::1]/article"), "");
  assert.equal(canonicalArticleUrl("http://localhost:3000/article"), "");
  assert.equal(canonicalArticleUrl("http://[::1]/article"), "");
  assert.equal(canonicalArticleUrl("ftp://example.com/article"), "");
});

test("nextCrawlInfo skips weekends and respects the Berlin cutoff", () => {
  assert.equal(nextCrawlInfo(new Date("2026-09-18T18:00:00Z")).date, "2026-09-21");
  assert.equal(nextCrawlInfo(new Date("2026-09-20T23:16:00Z")).relativeLabel, "today");
  assert.equal(nextCrawlInfo(new Date("2026-09-20T23:17:00Z")).relativeLabel, "tomorrow");
  assert.equal(nextCrawlInfo(new Date("2026-09-21T03:00:00Z")).relativeLabel, "tomorrow");
  assert.equal(nextCrawlInfo(new Date("2026-09-21T03:00:00Z")).scheduledTime, "01:17");
  assert.equal(nextCrawlInfo(new Date("2026-09-21T10:00:00Z")).relativeLabel, "tomorrow");
});

test("worker creates an anonymous issue and returns the next crawl", async () => {
  const env = envWithIssues();
  const response = await worker.fetch(request({ url: "https://example.com/article?utm_source=test", clientId: "client-123" }), env);
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.status, "accepted");
  assert.equal(body.url, "https://example.com/article");
  const createCall = env.calls.find((call) => call.options.method === "POST");
  assert.match(JSON.parse(createCall.options.body).body, /Submitted anonymously/);
});

test("worker distinguishes queued and historical duplicates", async () => {
  const queuedEnv = envWithIssues([{ state: "open", title: "Shared article: example.com", body: "Article URL: https://example.com/a" }]);
  const queued = await worker.fetch(request({ url: "https://www.example.com/a", clientId: "client-123" }), queuedEnv);
  assert.equal((await queued.json()).status, "duplicate_queued");

  const historyEnv = envWithIssues([{ state: "closed", closed_at: "2026-09-14T06:20:00Z", title: "Shared article: example.com", body: "Article URL: https://example.com/a" }]);
  const history = await worker.fetch(request({ url: "https://example.com/a", clientId: "client-456" }), historyEnv);
  assert.equal((await history.json()).status, "duplicate_history");
});

test("worker checks older issue pages for duplicates", async () => {
  const firstPage = Array.from({ length: 100 }, (_, index) => ({
    state: "closed",
    title: `Shared article: source-${index}.example`,
    body: `Article URL: https://source-${index}.example/story`,
  }));
  const env = envWithIssues([
    firstPage,
    [{ state: "open", title: "Shared article: example.com", body: "Article URL: https://example.com/older" }],
  ]);
  const response = await worker.fetch(request({ url: "https://example.com/older", clientId: "client-789" }), env);
  assert.equal((await response.json()).status, "duplicate_queued");
  assert.equal(env.calls.filter((call) => call.url.includes("/issues?")).length, 2);
});

test("worker accepts a scheme-less URL and blocks the sixth hourly request", async () => {
  const env = envWithIssues();
  for (let index = 0; index < 5; index += 1) {
    const response = await worker.fetch(request({ url: `www.example.com/article-${index}`, clientId: "client-limit" }), env);
    assert.equal(response.status, 201);
    assert.equal((await response.json()).url, `https://example.com/article-${index}`);
  }
  const response = await worker.fetch(request({ url: "www.example.com/article-6", clientId: "client-limit" }), env);
  assert.equal(response.status, 429);
  assert.equal((await response.json()).status, "rate_limited");
  assert.equal(env.calls.filter((call) => call.options.method === "POST").length, 5);
});

test("worker refuses unverified requests without creating an issue", async () => {
  const env = envWithIssues();
  delete env.ALLOW_UNVERIFIED_SUBMISSIONS;
  const response = await worker.fetch(request({ url: "www.example.com/story", clientId: "client-verify" }), env);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).status, "verification_required");
  assert.equal(env.calls.length, 0);
});

test("worker handles CORS preflight and missing backend configuration", async () => {
  const env = envWithIssues();
  const preflight = await worker.fetch(new Request("https://intake.example.com", {
    method: "OPTIONS", headers: { origin: "http://localhost:5173" },
  }), env);
  assert.equal(preflight.status, 204);
  assert.equal(await preflight.text(), "");
  assert.equal(preflight.headers.get("access-control-allow-origin"), "http://localhost:5173");
  delete env.GITHUB_TOKEN;
  const response = await worker.fetch(request({ url: "example.com/article", clientId: "client-config" }), env);
  assert.equal(response.status, 503);
  assert.equal(env.calls.length, 0);
});
