import { createServer } from "node:http";
import { mkdir, readFile, writeFile, chmod } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

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
const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.search = new URLSearchParams({
  client_id: client.client_id,
  redirect_uri: redirectUri,
  response_type: "code",
  scope: "https://www.googleapis.com/auth/gmail.readonly",
  access_type: "offline",
  prompt: "consent",
  include_granted_scopes: "true",
}).toString();

console.log("Open this URL in your browser and authorize the newsletter-only Gmail inbox:");
console.log(authUrl.toString());

const code = await new Promise((resolve, reject) => {
  server.once("request", (request, response) => {
    const callback = new URL(request.url, redirectUri);
    if (callback.searchParams.get("error")) {
      response.end("Authorization failed. You can close this tab.");
      reject(new Error(callback.searchParams.get("error")));
      return;
    }
    response.end("Gmail authorization complete. You can close this tab and return to Codex.");
    resolve(callback.searchParams.get("code"));
  });
});
server.close();

const response = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  body: new URLSearchParams({
    code,
    client_id: client.client_id,
    client_secret: client.client_secret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  }),
});
if (!response.ok) throw new Error(`Token exchange failed: ${response.status} ${await response.text()}`);
const token = await response.json();
if (!token.refresh_token) throw new Error("Google did not return a refresh token. Remove the app grant and run again with consent.");

const authDir = path.join(process.cwd(), ".auth");
const outputFile = path.join(authDir, "google-oauth.json");
await mkdir(authDir, { recursive: true });
await writeFile(outputFile, `${JSON.stringify({
  GOOGLE_CLIENT_ID: client.client_id,
  GOOGLE_CLIENT_SECRET: client.client_secret,
  GOOGLE_REFRESH_TOKEN: token.refresh_token,
}, null, 2)}\n`, { mode: 0o600 });
await chmod(outputFile, 0o600);
console.log(`Credentials saved locally to ${outputFile}. The file is ignored by Git.`);
