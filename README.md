# design / daily

`design / daily` is a shared daily read for a UX and UI design team. It combines a dedicated newsletter-only Gmail inbox with selected web feeds, ranks the newest material, and publishes four cited editorial questions each morning.

## Publication architecture

- GitHub Pages serves the static React site.
- GitHub Actions runs the crawl Monday through Friday at 01:17 in `Europe/Berlin`.
- The Gmail API reads the newsletter inbox with the read-only scope.
- The OpenAI Responses API clusters and synthesizes the crawl into structured JSON.
- Generated editions live in `public/data`. Previous editions are copied into `public/data/archive`.
- Anonymous article suggestions pass through a small Cloudflare Worker, become GitHub issues, and are included automatically in the next crawl.

No Gmail or OpenAI credential is shipped to the browser. Raw newsletter bodies are not written to `public/data`, and published newsletter links have query parameters and known tracking routes removed.

## One-time launch setup

### 1. Create the Google OAuth client

In Google Cloud Console:

1. Create or select a project.
2. Enable the Gmail API.
3. Configure the OAuth consent screen. Use Production status for a durable refresh token. A Testing app using Gmail scopes can issue refresh tokens that expire after seven days.
4. Create an OAuth client of type Desktop app and download its JSON file.
5. From this repository, run:

```bash
node scripts/google-oauth.mjs /absolute/path/to/google-desktop-client.json
```

Authorize the dedicated newsletter Gmail account in the browser. The helper writes `.auth/google-oauth.json`, which is ignored by Git.

### 2. Add GitHub repository secrets

In `Settings > Secrets and variables > Actions`, create these repository secrets using the values from `.auth/google-oauth.json`:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `OPENAI_API_KEY`

Optional repository variables:

- `OPENAI_MODEL`, default `gpt-5.4-mini`
- `GMAIL_QUERY`, default `newer_than:2d -in:spam -in:trash`

### 3. Configure anonymous article intake

The static site never receives a GitHub token. `submission-worker/` contains the small server-side intake that validates URLs, applies rate limits, checks for duplicates, and creates the GitHub issue.

1. Create a Cloudflare Turnstile widget for the Pages domain.
2. Use the SQLite-backed `SubmissionRateLimit` Durable Object for atomic submission quotas.
3. Copy `submission-worker/wrangler.toml.example` to `submission-worker/wrangler.toml`. Existing deployments must add its `SUBMISSION_RATE_LIMIT` binding and migration together with the new Worker code. Without the binding, intake returns 503 instead of accepting unmetered submissions. The former `SUBMISSION_KV` binding is no longer used; do not delete its namespace as part of the rollout.
4. Add Worker secrets named `GITHUB_TOKEN` and `TURNSTILE_SECRET`. Use a fine-grained GitHub token with Issues read and write access only for this repository.
5. Deploy the Worker. The production Worker URL and public Turnstile site key are included as safe frontend defaults; the optional GitHub Actions variables `ARTICLE_SUBMISSION_ENDPOINT` and `TURNSTILE_SITE_KEY` can override them.

The Worker allows up to five verified attempts per browser per UTC hour and 50 per network per UTC day, using transactional counters that remain correct under simultaneous requests. It requires server-side Turnstile verification for the requesting hostname; there is no production verification bypass. Local UI reviews use the existing browser-only mock. It rejects URLs already queued or found in a completed crawl. After a successful edition is written, the crawler closes the processed issues so later duplicate checks can distinguish queued links from crawl history. Active quota counters expire within two hours or two days; Cloudflare's recovery history can retain copies for up to 30 days.

### 4. Enable GitHub Pages

In `Settings > Pages`, set the source to `GitHub Actions`. Then run the `Publish design daily` workflow once from the Actions tab. The public URL will be:

`https://r4ph426.github.io/design-daily/`

## Local verification

```bash
pnpm test
pnpm run crawl:dry
pnpm run build:pages
```

The existing Sites-compatible build is preserved:

```bash
pnpm run build
pnpm run test:sites
```

In local development, article submission uses a browser-only mock so the accepted and duplicate states can be reviewed without creating GitHub issues.

## Source configuration

Curated feeds are listed in `data/sources.json`. Each entry can include a homepage URL, a direct feed URL, one of the three categories, and UI or UX tags. Open GitHub issues whose titles begin with `Shared article:` are also crawled on the next scheduled run.

## Security verification

See [the 6 October 2026 security review](security-review-2026-10-06.md) for findings, fixes, rollout requirements, evidence, and remaining limits. `npm test` includes malicious URL, DNS/redirect, request-body, OAuth, and concurrent quota regressions. Both npm and pnpm lockfiles are maintained; audit both when updating dependencies. The scheduled publication workflow runs security regressions before accessing crawler credentials.

Public crawls use DNS validation and socket pinning on each redirect, HTTP/HTTPS web ports only, bounded response bodies, and a total timeout. Public builds include a Content-Security-Policy allowing the configured HTTPS intake and Cloudflare Turnstile. The one-time Gmail setup helper uses state validation and S256 PKCE. No credentials are embedded in the site.


## Private inspiration canvas

Open `#/inspiration` for the weekly Image bands canvas. Captures live in IndexedDB in each browser, with no mandatory tags. Paste links or Chrome tab-share text, import bookmark HTML or a JSON backup, search/filter in Index, save crawler discoveries, and export JSON/CSV. Weeks follow Europe/Berlin and start on Monday. The visual detail supports source links, optional tags, keyboard navigation, zoom and touch inspection.

GitHub Pages publishes the UI and empty initial collection, never the owner’s records or images. Public HTTPS preview URLs in a reviewed JSON backup are retained; private/local/unsafe image URLs are discarded. Static capture uses URL-derived metadata. Automatic page metadata, AI summaries and Raindrop/Savee/Pinterest API sync require the loopback-only local service: `npm run inspiration` (Node 24). Keep credentials in an ignored `.env`; keep `.private/` and `.auth/` out of Git. Local and public origins do not silently share databases. Provider adapters have fixture tests; publication does not establish new live account connections.

Mobile: bookmark the capture URL, or install the PWA in Android Chrome and select What I came across in the share sheet. The service worker accepts shared URLs/text into a private draft; browser/platform installation is required. iOS and browsers without Share Target use copy/paste. Offline capture needs an online app visit first. Physical Android sharing remains unverified.

Desktop: save the three files in `public/capture-extension/` to one folder, enable Chrome Developer mode and Load unpacked. Set the public app URL, then choose current page, selected tabs or all tabs in the window. No browser history or other app conversations are read.

Validate with `npm run build`, `npm test` and `npm run test:inspiration`. Source configuration and account screens describe the local-service requirement rather than promise cloud sync.
