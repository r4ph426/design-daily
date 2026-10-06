import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import { canonicalArticleUrl } from "../shared/article-intake.mjs";
import { safeExternalHref } from "../shared/public-url.mjs";
import { canonicalUrl, decodeEntities, parseFeed } from "../scripts/lib/crawler.mjs";
import { fetchPublicText, resolvePublicUrl } from "../scripts/lib/public-fetch.mjs";
import { createOAuthSession, validOAuthCallback } from "../scripts/lib/oauth-session.mjs";

const publicDns = async () => [{ address: "93.184.216.34", family: 4 }];

test("OAuth setup binds callbacks to a random state and a PKCE challenge", () => {
  const session = createOAuthSession();
  assert.match(session.verifier, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(session.state, createOAuthSession().state);
  assert.notEqual(session.challenge, session.verifier);
  const redirect = "http://127.0.0.1:12345/oauth2/callback";
  const request = { method: "GET", url: `/oauth2/callback?state=${session.state}&code=fixture` };
  assert.equal(validOAuthCallback(request, redirect, session.state), true);
  for (const url of ["/oauth2/callback?code=fixture", "/oauth2/callback?state=wrong", `/other?state=${session.state}`, `https://evil.example/oauth2/callback?state=${session.state}`, `${request.url}&state=extra`]) assert.equal(validOAuthCallback({ ...request, url }, redirect, session.state), false);
  assert.equal(validOAuthCallback({ ...request, method: "POST" }, redirect, session.state), false);
});

test("public links reject private encodings, credentials, unsafe schemes and ports", () => {
  const rejected = ["http://127.1/a", "http://2130706433/a", "http://0x7f000001/a", "http://[::ffff:127.0.0.1]/a", "http://[::]/a", "http://[::1]/a", "http://[fc00::1]/a", "http://[fe80::1]/a", "http://[2002:7f00:1::]/a", "http://[2001:db8::1]/a", "http://[3fff::1]/a", "http://100.64.0.1/a", "http://169.254.169.254/a", "http://192.168.1.1/a", "http://127.0.0.1./a", "http://localhost./a", "http://router.internal/a", "https://user:password@example.com/a", "https://example.com:8443/a", "javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "file:///etc/passwd"];
  for (const url of rejected) {
    assert.equal(canonicalArticleUrl(url), "", url);
    assert.equal(canonicalUrl(url), "", url);
    assert.equal(safeExternalHref(url), undefined, url);
  }
  assert.equal(canonicalArticleUrl("https://example.com/story"), "https://example.com/story");
  assert.equal(canonicalArticleUrl("https://192.2.0.1/story"), "https://192.2.0.1/story");
  assert.equal(canonicalArticleUrl("https://[2606:4700:4700::1111]/a"), "https://[2606:4700:4700::1111]/a");
});

test("DNS validation rejects private, mixed and empty answers", async () => {
  for (const addresses of [[], [{ address: "127.0.0.1", family: 4 }], [...await publicDns(), { address: "::ffff:127.0.0.1", family: 6 }]]) {
    await assert.rejects(resolvePublicUrl("https://example.com", async () => addresses), /private or reserved/);
  }
});

function transportFixture(replies, seen = []) {
  return (url, options, callback) => {
    const request = new EventEmitter();
    const reply = replies[seen.length];
    seen.push({ url, options });
    queueMicrotask(() => {
      const response = Readable.from((reply.chunks || ["<title>Public article</title>"]).map((chunk) => Buffer.from(chunk)));
      response.statusCode = reply.status || 200;
      response.headers = { "content-type": "text/html; charset=utf-8", ...reply.headers };
      callback(response);
    });
    return request;
  };
}

test("crawler blocks private redirect destinations before a second connection", async () => {
  for (const location of ["http://127.0.0.1/private", "https://private.example/secret"]) {
    const seen = [];
    const lookup = async (host) => host === "private.example" ? [{ address: "10.0.0.1", family: 4 }] : publicDns();
    await assert.rejects(fetchPublicText("https://example.com", { lookup, request: transportFixture([{ status: 302, headers: { location } }], seen) }), /private|Private/);
    assert.equal(seen.length, 1);
  }
});

test("crawler pins validated DNS, preserves Host/TLS names, and sends no credentials", async () => {
  const seen = [];
  const response = await fetchPublicText("https://example.com", { lookup: publicDns, request: transportFixture([{}], seen) });
  assert.match(response.text, /Public article/);
  assert.equal(seen[0].url.hostname, "example.com");
  assert.equal(seen[0].options.agent, false);
  assert.equal(seen[0].options.headers.authorization, undefined);
  assert.equal(seen[0].options.headers.cookie, undefined);
  seen[0].options.lookup("example.com", { all: true }, (error, addresses) => {
    assert.equal(error, null);
    assert.deepEqual(addresses, [{ address: "93.184.216.34", family: 4 }]);
  });
});

test("crawler bounds streamed bytes, redirects, content types and DNS time", async () => {
  await assert.rejects(fetchPublicText("https://example.com", { lookup: publicDns, limit: 10, request: transportFixture([{ chunks: ["123456", "123456"] }]) }), /size limit/);
  await assert.rejects(fetchPublicText("https://example.com", { lookup: publicDns, request: transportFixture([{ headers: { "content-type": "application/octet-stream" } }]) }), /content type/);
  await assert.rejects(fetchPublicText("https://example.com", { lookup: publicDns, maxRedirects: 1, request: transportFixture([{ status: 302, headers: { location: "/a" } }, { status: 302, headers: { location: "/b" } }]) }), /Too many/);
  await assert.rejects(fetchPublicText("https://example.com", { lookup: () => new Promise(() => {}), timeout: 10 }), /timed out/);
});

test("malicious feeds cannot publish executable links or crash entity decoding", () => {
  const rows = parseFeed('<rss><item><title>Design &#99999999999;</title><link>javascript:alert(1)</link></item></rss>', { name: "Untrusted", category: "UX", tags: [] });
  assert.deepEqual(rows, []);
  assert.equal(decodeEntities("Text &#99999999999;"), "Text ");
});
