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


## What I came across: Rapha’s public weekly journal

The live `#/inspiration` route reads a shared public snapshot from `public/data/inspiration.json`. Visitors see the same approved discoveries, including image and video references, grouped by publication week. They can search, open details, browse and follow source links. They cannot edit, capture into or connect accounts to the published journal. The initial Week 41 publication contains the six new Savee references explicitly approved on 7 October 2026. Original Savee save dates are unavailable; the week is confirmed by the owner.

Loopback origins retain the private capture/import/export and account workspace; `?audience=public` previews the public journal locally. Private SQLite data, IndexedDB records, notes, projects, raw account batches and tokens are never copied into the public snapshot. The existing scheduled Savee connector still imports privately and does not publish automatically.

To publish a reviewed selection, run Node 24 `scripts/inspiration/publish.mjs` with `--database` (private SQLite path), `--approved` (a private JSON array of explicitly approved local IDs), `--week` (Monday YYYY-MM-DD), and `--output public/data/inspiration.json`. The exporter opens SQLite read-only, strips private fields, uses stable public Savee IDs and retains earlier published weeks. Review and push only the approved public snapshot and code. Never publish the approval file or raw account export.

The mobile shared header keeps Today and Archive visible; Toolbox, What I came across and Privacy are in the ellipsis menu. All desktop routes use identical tab widths.


## Automatic Monday Toolbox publication

The Monday workflow runs at 04:37 Europe/Berlin. It discovers candidates, fetches original sources with the existing bounded public transport, and uses the configured OpenAI model for a source review. At most three new entries enter per run, always as `Watching` and explicitly not team-tested. Existing IDs, source URLs, verdicts and confidence stay intact; only verified description, recommendation, access and setup changes are eligible. Unavailable sources retain their existing entries. Missing evidence or invalid structured output blocks publication. Empty reviews do not change the displayed review date.

After tests and a Pages build pass, the workflow commits the reviewed collection to main and deploys Pages directly. The ordinary push workflow cannot be relied on because pushes using `GITHUB_TOKEN` do not trigger it. Both publication workflows share a concurrency group. `data/toolbox-update-log.json` retains the latest before/after log for delivery retries; it is editor data and is not imported by the frontend or copied to public assets. A workflow artifact retains each run's log for 30 days. Private inspiration data is excluded.

Email requires three repository secrets under Settings → Secrets and variables → Actions:

- `BREVO_API_KEY`: a Brevo API sending key. The key used by Miki may also be configured here securely; repository secrets are not shared automatically.
- `TOOLBOX_EMAIL_FROM`: a plain verified address. The workflow defaults to `hello@ra-re.agency`; a repository secret or variable can override it.
- `TOOLBOX_EMAIL_TO`: comma-separated recipients.

The existing Gmail token is read-only and is not used for sending. Never put these secrets in `VITE_` variables, Git, or public assets. The email includes additions, changed fields with before/after values, source passages, skipped source checks, the live page, commit and workflow links, and correction instructions. No-change runs send a short confirmation; failed runs report failure if delivery is configured. A missing or rejected sending configuration makes the workflow visibly fail rather than claiming email delivery. Provider acceptance is not proof of inbox delivery. Re-running a successful publication can replay its persisted log. A durable `data/toolbox-email-state.json` checkpoint is pushed before the Brevo request and after acknowledgement. It contains dates and statuses only, never addresses, credentials or email content, and is not copied to the website. At most one accepted update per Berlin calendar day is sent, even if the content changes on a rerun. Network failures, server errors and invalid acknowledgements block automatic retries pending manual reconciliation against Brevo transactional logs. Explicit rejections can be retried after correcting configuration. The workflow concurrency group serializes scheduled/manual runs; local notification commands must not run concurrently. If a send was accepted but state persistence failed, the previously pushed `sending` marker prevents another send. After verifying logs, an operator may change the affected date to `accepted`, or to `rejected` only when non-acceptance is confirmed.

Run the workflow manually from Actions → Refresh and publish Toolbox → Run workflow after configuring email to test the complete publication and delivery path. Local checks: `node --test tests/toolbox*.test.mjs`, `node scripts/toolbox-crawl.mjs --dry-run`. Automatic source reviews are fallible; corrections should be made in `data/toolbox.json`, or the linked publication commit can be reverted.
