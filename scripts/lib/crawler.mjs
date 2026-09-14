import { createHash } from "node:crypto";

const DESIGN_TERMS = [
  "accessibility",
  "ai",
  "brand",
  "design",
  "figma",
  "interface",
  "product",
  "prototype",
  "research",
  "service design",
  "ui",
  "usability",
  "ux",
  "workflow",
];

const HIGH_SIGNAL_TERMS = [
  "case study",
  "field study",
  "framework",
  "method",
  "research",
  "study",
  "system",
  "tool",
];

export function decodeEntities(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

export function htmlToText(value = "") {
  return decodeEntities(value)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function decodeBase64Url(value = "") {
  if (!value) return "";
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

export function canonicalUrl(rawUrl = "") {
  try {
    const parsed = new URL(rawUrl);
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|mc_|ref$|referrer$|source$)/i.test(key)) parsed.searchParams.delete(key);
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

export function itemId(item) {
  const identity = canonicalUrl(item.url) || `${item.source}|${item.title}|${item.publishedAt}`;
  return createHash("sha256").update(identity).digest("hex").slice(0, 16);
}

function tagContent(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match?.[1] ?? "";
}

function linkFromEntry(block) {
  const atom = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
  if (atom) return decodeEntities(atom[1]);
  return htmlToText(tagContent(block, "link"));
}

function normalizeDate(value, fallback) {
  const timestamp = Date.parse(htmlToText(value));
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : fallback;
}

export function parseFeed(xml, source, now = new Date()) {
  const fallbackDate = now.toISOString();
  const blocks = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>|<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi) ?? [];

  return blocks.slice(0, 12).map((block) => {
    const title = htmlToText(tagContent(block, "title"));
    const description =
      tagContent(block, "content:encoded") ||
      tagContent(block, "content") ||
      tagContent(block, "description") ||
      tagContent(block, "summary");
    const published =
      tagContent(block, "pubDate") ||
      tagContent(block, "published") ||
      tagContent(block, "updated") ||
      tagContent(block, "dc:date");

    const item = {
      source: source.name,
      sourceKind: "web crawl",
      category: source.category ?? "Practice",
      tags: source.tags ?? [],
      title,
      excerpt: htmlToText(description).slice(0, 1800),
      url: canonicalUrl(linkFromEntry(block)),
      publishedAt: normalizeDate(published, fallbackDate),
    };
    return { ...item, id: itemId(item) };
  }).filter((item) => item.title && item.url);
}

function findMimePart(part, mimeType) {
  if (!part) return "";
  if (part.mimeType === mimeType && part.body?.data) return decodeBase64Url(part.body.data);
  for (const child of part.parts ?? []) {
    const body = findMimePart(child, mimeType);
    if (body) return body;
  }
  return "";
}

function findMimeBody(part) {
  return findMimePart(part, "text/html") || findMimePart(part, "text/plain");
}

function firstUsefulUrl(value = "") {
  const links = value.match(/https?:\/\/[^\s"'<>\])]+/g) ?? [];
  for (const link of links) {
    try {
      const parsed = new URL(decodeEntities(link));
      if (/(unsubscribe|preferences|tracking|pixel|list-manage|mailchi\.mp|click\.convertkit|email\.mail|trk\.)/i.test(`${parsed.hostname}${parsed.pathname}`)) continue;
      parsed.search = "";
      parsed.hash = "";
      return parsed.toString().replace(/\/$/, "");
    } catch {
      continue;
    }
  }
  return "";
}

export function extractGmailMessage(message) {
  const headers = Object.fromEntries(
    (message.payload?.headers ?? []).map((header) => [header.name.toLowerCase(), header.value]),
  );
  const rawBody = findMimeBody(message.payload);
  const from = headers.from ?? "Newsletter";
  const source = from.replace(/\s*<[^>]+>\s*$/, "").replace(/^"|"$/g, "").trim() || "Newsletter";
  const item = {
    source,
    sourceKind: "newsletter inbox",
    category: "Practice",
    tags: [],
    title: headers.subject || "Untitled newsletter",
    excerpt: htmlToText(rawBody || message.snippet || "").slice(0, 2200),
    url: firstUsefulUrl(headers["list-archive"] || "") || firstUsefulUrl(rawBody),
    publishedAt: new Date(Number(message.internalDate || Date.now())).toISOString(),
    gmailMessageId: message.id,
  };
  return { ...item, id: itemId(item) };
}

export function scoreItem(item, now = new Date()) {
  const haystack = `${item.title} ${item.excerpt} ${(item.tags ?? []).join(" ")}`.toLowerCase();
  const ageHours = Math.max(0, (now.getTime() - Date.parse(item.publishedAt)) / 3_600_000);
  const recency = Math.max(0, 36 - ageHours) / 4;
  const designHits = DESIGN_TERMS.filter((term) => haystack.includes(term)).length;
  const signalHits = HIGH_SIGNAL_TERMS.filter((term) => haystack.includes(term)).length;
  const inboxBonus = item.sourceKind === "newsletter inbox" ? 2 : 0;
  return Math.round((recency + designHits * 1.6 + signalHits * 1.2 + inboxBonus) * 10) / 10;
}

export function dedupeItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = canonicalUrl(item.url) || `${item.source.toLowerCase()}|${item.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export function normalizeAiEdition(aiEdition, itemMap) {
  return aiEdition.questions.map((question, index) => {
    const signalItems = question.signals
      .map((signal) => ({ signal, item: itemMap.get(signal.sourceId) }))
      .filter(({ item }) => item)
      .slice(0, 3);
    const further = question.furtherSourceIds
      .map((id) => itemMap.get(id))
      .filter(Boolean)
      .slice(0, 5)
      .map((item) => [item.title, item.source, item.url]);

    return {
      id: String(index + 1).padStart(2, "0"),
      slug: slugify(question.question) || `question-${index + 1}`,
      category: question.category,
      tags: question.tags,
      question: question.question,
      answer: question.answer,
      why: question.why,
      counts: {
        total: question.sourceIds.length,
        newsletters: question.sourceIds.filter((id) => itemMap.get(id)?.sourceKind === "newsletter inbox").length,
        web: question.sourceIds.filter((id) => itemMap.get(id)?.sourceKind === "web crawl").length,
      },
      firstSeen: signalItems[0]?.item?.publishedAt
        ? `${new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Berlin" }).format(new Date(signalItems[0].item.publishedAt))} cet`
        : "today",
      signals: signalItems.map(({ signal, item }) => ({
        source: item.source,
        kind: item.sourceKind === "newsletter inbox" ? "Newsletter" : "Web",
        timing: new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Berlin" }).format(new Date(item.publishedAt)),
        happened: signal.happened,
        changes: signal.changes,
        verdict: signal.verdict,
        url: item.url,
      })),
      further,
    };
  });
}

export function extractResponseText(payload) {
  if (payload.output_text) return payload.output_text;
  for (const output of payload.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  return "";
}
