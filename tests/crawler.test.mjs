import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalUrl,
  decodeBase64Url,
  dedupeItems,
  extractGmailMessage,
  parseFeed,
  scoreItem,
} from "../scripts/lib/crawler.mjs";
import { validateCategoryRecord } from "../src/taxonomy.js";

test("parseFeed reads RSS and canonicalizes tracking URLs", () => {
  const xml = `<?xml version="1.0"?><rss><channel><item><title>Design systems and AI</title><link>https://example.com/story?utm_source=test</link><description><![CDATA[<p>A research framework.</p>]]></description><pubDate>Thu, 10 Sep 2026 06:00:00 GMT</pubDate></item></channel></rss>`;
  const [item] = parseFeed(xml, { name: "Example", category: "Process", tags: ["UX"] });
  assert.equal(item.title, "Design systems and AI");
  assert.equal(item.url, "https://example.com/story");
  assert.equal(item.excerpt, "A research framework.");
});

test("taxonomy rejects free text and legacy categories", () => {
  assert.throws(() => validateCategoryRecord({ category: "Practice", tags: [], aiLens: false }), /invalid category/);
  assert.throws(() => validateCategoryRecord({ category: "UX", tags: ["Research"], aiLens: false }), /invalid category tags/);
});

test("extractGmailMessage reads a newsletter MIME body", () => {
  const html = '<h1>Design research</h1><a href="https://example.com/read">Read</a>';
  const item = extractGmailMessage({
    id: "message-1",
    internalDate: "1789012800000",
    payload: {
      headers: [
        { name: "From", value: "Design Notes <notes@example.com>" },
        { name: "Subject", value: "A better research loop" },
      ],
      mimeType: "text/html",
      body: { data: Buffer.from(html).toString("base64url") },
    },
  });
  assert.equal(item.source, "Design Notes");
  assert.equal(item.title, "A better research loop");
  assert.equal(item.url, "https://example.com/read");
  assert.match(decodeBase64Url(Buffer.from("hello").toString("base64url")), /hello/);
});

test("dedupeItems and scoreItem favor recent design newsletters", () => {
  const now = new Date("2026-09-10T12:00:00Z");
  const item = { source: "A", sourceKind: "newsletter inbox", title: "AI design research framework", excerpt: "A UI and UX case study", url: "https://example.com/a", publishedAt: "2026-09-10T11:00:00Z" };
  assert.equal(dedupeItems([item, { ...item }]).length, 1);
  assert.ok(scoreItem(item, now) > scoreItem({ ...item, sourceKind: "web crawl", title: "General update", excerpt: "", publishedAt: "2026-09-08T11:00:00Z" }, now));
  assert.equal(canonicalUrl("https://example.com/a?utm_campaign=x"), "https://example.com/a");
});
