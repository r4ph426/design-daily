import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createOAuthSession() {
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  return { state, verifier, challenge: createHash("sha256").update(verifier).digest("base64url") };
}

export function validOAuthCallback(request, redirectUri, state) {
  try {
    const callback = new URL(request.url, redirectUri);
    const actual = Buffer.from(callback.searchParams.get("state") || "");
    const expected = Buffer.from(state);
    return request.method === "GET" && callback.origin === new URL(redirectUri).origin
      && callback.pathname === "/oauth2/callback" && actual.length === expected.length
      && timingSafeEqual(actual, expected) && callback.searchParams.getAll("state").length === 1;
  } catch { return false; }
}
