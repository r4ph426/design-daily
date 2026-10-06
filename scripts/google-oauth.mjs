import { createServer } from "node:http";
import { mkdir, readFile, writeFile, chmod } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createOAuthSession, validOAuthCallback } from "./lib/oauth-session.mjs";

const credentialsFile = process.argv[2];
if (!credentialsFile) {
  console.error("Usage: node scripts/google-oauth.mjs /path/to/google-desktop-client.json");
  process.exit(1);
}

const raw = JSON.parse(await readFile(credentialsFile, "utf8"));
const client = raw.installed || raw.web;
if (!client?.client_id || !client?.client_secret) throw new Error("The Google OAuth client JSON is missing client credentials.");

const server = createServer();
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const redirectUri = `http://127.0.0.1:${address.port}/oauth2/callback`;
const session = createOAuthSession();
const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.search = new URLSearchParams({
  client_id: client.client_id,
  redirect_uri: redirectUri,
  response_type: "code",
  scope: "https://www.googleapis.com/auth/gmail.readonly",
  access_type: "offline",
  prompt: "consent",
  include_granted_scopes: "true",
  state: session.state,
  code_challenge: session.challenge,
  code_challenge_method: "S256",
}).toString();

console.log("Open this URL in your browser and authorize the newsletter-only Gmail inbox:");
console.log(authUrl.toString());

const code = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => { server.close(); reject(new Error("Authorization timed out. Run the helper again.")); }, 300_000);
  server.on("request", (request, response) => {
    response.setHeader("cache-control", "no-store");
    response.setHeader("content-type", "text/plain; charset=utf-8");
    response.setHeader("x-content-type-options", "nosniff");
    if (!validOAuthCallback(request, redirectUri, session.state)) {
      response.writeHead(400);
      response.end("Invalid authorization callback. Return to the authorization tab.");
      return;
    }
    const callback = new URL(request.url, redirectUri);
    clearTimeout(timer);
    server.close();
    if (callback.searchParams.get("error")) {
      response.end("Authorization failed. You can close this tab.");
      reject(new Error("Google authorization was denied."));
      return;
    }
    if (!callback.searchParams.get("code") || callback.searchParams.getAll("code").length !== 1) {
      response.writeHead(400);
      response.end("Authorization code missing. Run the helper again.");
      reject(new Error("Authorization code missing."));
      return;
    }
    response.end("Gmail authorization complete. You can close this tab and return to Codex.");
    resolve(callback.searchParams.get("code"));
  });
});

const response = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  signal: AbortSignal.timeout(20_000),
  redirect: "error",
  body: new URLSearchParams({
    code,
    client_id: client.client_id,
    client_secret: client.client_secret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    code_verifier: session.verifier,
  }),
});
if (!response.ok) throw new Error(`Token exchange failed: ${response.status}`);
const token = await response.json();
if (!token.refresh_token) throw new Error("Google did not return a refresh token. Remove the app grant and run again with consent.");

const authDir = path.join(process.cwd(), ".auth");
const outputFile = path.join(authDir, "google-oauth.json");
await mkdir(authDir, { recursive: true, mode: 0o700 });
await writeFile(outputFile, `${JSON.stringify({
  GOOGLE_CLIENT_ID: client.client_id,
  GOOGLE_CLIENT_SECRET: client.client_secret,
  GOOGLE_REFRESH_TOKEN: token.refresh_token,
}, null, 2)}\n`, { mode: 0o600 });
await chmod(outputFile, 0o600);
console.log(`Credentials saved locally to ${outputFile}. The file is ignored by Git.`);
