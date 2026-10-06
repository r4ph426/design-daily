// Syntax checks are shared by the browser and Worker. The crawler must also
// resolve and pin public DNS addresses before EVERY request, including redirects.
export function isPublicAddress(address) {
  const host = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (host.includes(":")) {
    try {
      const normalized = new URL(`http://[${host}]/`).hostname.slice(1, -1);
      const [first, second = 0] = normalized.split(":").map((part) => parseInt(part || "0", 16));
      // Global unicast only; exclude protocol assignments, documentation and 6to4.
      return first >= 0x2000 && first <= 0x3fff
        && !(first === 0x2001 && (second < 0x200 || second === 0xdb8))
        && first !== 0x2002 && !(first === 0x3fff && second < 0x1000);
    } catch { return false; }
  }
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  const [a, b, c, d] = host.split(".").map(Number);
  if ([a, b, c, d].some((part) => part > 255)) return false;
  return !(a === 0 || a === 10 || a === 127 || a >= 224
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)) || (b === 88 && c === 99)))
    || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100)))
    || (a === 203 && b === 0 && c === 113));
}

export function publicHttpUrl(raw) {
  if (typeof raw !== "string" || !raw.trim() || raw.length > 8192 || /[\u0000-\u0020\u007f\\]/.test(raw)) {
    throw new Error("Use a public HTTP or HTTPS URL.");
  }
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password
    || (url.port && !["80", "443"].includes(url.port))) {
    throw new Error("Use a public HTTP or HTTPS URL without credentials or a custom port.");
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (host.includes(":") || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    if (!isPublicAddress(host)) throw new Error("Private or reserved addresses are not allowed.");
  } else if (!host.includes(".") || /(^|\.)(localhost|local|internal|home|lan|test|invalid|onion)$/.test(host)) {
    throw new Error("Private or internal hostnames are not allowed.");
  }
  url.hostname = host;
  return url;
}

export function safeExternalHref(raw) {
  try { return publicHttpUrl(raw).href; }
  catch { return undefined; }
}
