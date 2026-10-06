import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { isPublicAddress, publicHttpUrl } from "../../shared/public-url.mjs";

export async function resolvePublicUrl(raw, lookup = dns.lookup) {
  const url = publicHttpUrl(raw);
  const addresses = await lookup(url.hostname.replace(/^\[|\]$/g, ""), { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new Error("Source resolves to a private or reserved network.");
  }
  return { url, address: addresses[0] };
}

// No ambient cookies or credentials; validate all DNS answers and pin the socket
// to a checked address while preserving the hostname for Host and TLS validation.
export async function fetchPublicText(raw, {
  lookup = dns.lookup, request = (url, options, callback) => (url.protocol === "https:" ? https : http).get(url, options, callback),
  timeout = 20_000, limit = 2_000_000, maxRedirects = 4,
} = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const aborted = new Promise((_, reject) => controller.signal.addEventListener("abort", () => reject(new Error("Source timed out.")), { once: true }));
  async function read() {
    let candidate = raw;
    for (let hop = 0; hop <= maxRedirects; hop += 1) {
      const { url, address } = await resolvePublicUrl(candidate, lookup);
      controller.signal.throwIfAborted();
      const result = await new Promise((resolve, reject) => {
        const req = request(url, {
          signal: controller.signal,
          agent: false,
          headers: { "user-agent": "design-daily-crawler/1.0", accept: "text/html, application/xhtml+xml, application/rss+xml, application/atom+xml, application/xml, text/xml, text/plain", "accept-encoding": "identity" },
          lookup: (_hostname, options, callback) => callback(null, options.all ? [address] : address.address, address.family),
        }, (response) => {
          const status = response.statusCode;
          if ([301, 302, 303, 307, 308].includes(status)) {
            response.destroy();
            return resolve({ location: response.headers.location });
          }
          const rejectResponse = (message) => { response.destroy(); reject(new Error(message)); };
          if (status < 200 || status >= 300) return rejectResponse(`Source returned HTTP ${status}.`);
          if (!/^(text\/(html|plain|xml)|application\/(xhtml\+xml|rss\+xml|atom\+xml|xml))(\s*;|$)/i.test(response.headers["content-type"] || "")) return rejectResponse("Unsupported source content type.");
          if (response.headers["content-encoding"] && response.headers["content-encoding"] !== "identity") return rejectResponse("Compressed source responses are not supported.");
          if (Number(response.headers["content-length"]) > limit) return rejectResponse("Source exceeds the response size limit.");
          const chunks = [];
          let size = 0;
          response.on("error", reject);
          response.on("aborted", () => reject(new Error("Source response was interrupted.")));
          response.on("data", (chunk) => {
            size += chunk.length;
            if (size > limit) rejectResponse("Source exceeds the response size limit.");
            else chunks.push(chunk);
          });
          response.on("end", () => resolve({ text: Buffer.concat(chunks).toString("utf8"), url: url.href }));
        });
        req.on("error", reject);
      });
      if (result.text !== undefined) return result;
      if (!result.location) throw new Error("Redirect has no destination.");
      candidate = new URL(result.location, url).href;
    }
    throw new Error("Too many source redirects.");
  }
  try { return await Promise.race([read(), aborted]); }
  finally { clearTimeout(timer); }
}
