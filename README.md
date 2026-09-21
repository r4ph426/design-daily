# design / daily

`design / daily` is a shared daily read for a UX and UI design team. It combines a dedicated newsletter-only Gmail inbox with selected web feeds, ranks the newest material, and publishes four cited editorial questions each morning.

## Publication architecture

- GitHub Pages serves the static React site.
- GitHub Actions runs the crawl Monday through Friday at 06:17 in `Europe/Berlin`.
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
2. Create a Workers KV namespace and bind it as `SUBMISSION_KV`.
3. Copy `submission-worker/wrangler.toml.example` to `submission-worker/wrangler.toml` and add the KV namespace ID.
4. Add Worker secrets named `GITHUB_TOKEN` and `TURNSTILE_SECRET`. Use a fine-grained GitHub token with Issues read and write access only for this repository.
5. Deploy the Worker and set these GitHub Actions repository variables:
   - `ARTICLE_SUBMISSION_ENDPOINT`, the deployed Worker URL
   - `TURNSTILE_SITE_KEY`, the public Turnstile site key

The Worker allows up to five links per browser per hour and 50 per network per day. It rejects URLs already queued or found in a completed crawl. After a successful edition is written, the crawler closes the processed issues so later duplicate checks can distinguish queued links from crawl history.

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
