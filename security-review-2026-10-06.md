# design / daily security review

Reviewed 6 October 2026. The security release was prepared in an isolated worktree from current published main (94dffcf), preserving its latest editions and design changes. The hardened Worker is deployed; Pages publication is the remaining rollout step at this snapshot. This is a bounded source review with local adversarial tests and non-destructive live checks, not a guarantee that no vulnerabilities exist.

## Scope and evidence

- Reviewed the React reading routes, external links, public builds, anonymous contribution Worker, shared URL validation, daily crawler, Toolbox crawler, OAuth setup helper, and GitHub Actions workflows.
- Read the current public Pages HTML, its two JavaScript entry bundles, the Worker preflight response, and a rejected-origin response. The page returned 200 with HSTS; the Worker allowed the configured Pages origin and rejected an unrelated origin with 403. No real article was submitted, issue created, or mailbox accessed during these checks.
- Fetched the current public repository's daily crawler and intake source. Both contained the vulnerable fetch/counter patterns described below. The production Worker was subsequently verified and updated as recorded below.
- Scanned 159 unique tracked/public/bundle paths for common GitHub, OpenAI, Google refresh-token, and private-key signatures. No matches. This is not proof that every possible secret encoding or historical commit is clean. The public Turnstile site key and Worker URL are intentionally public.
- Scanned all 46 built client files separately: no credential-pattern matches or private data/configuration filenames were found.
- Preserved the checkout's pre-existing design changes and private inspiration files. The private inspiration service received only a boundary review and its existing tests; it was not treated as a newly authorized feature release.

## Findings and changes

### 1. High: crawler requests could reach private networks

The daily crawler fetched GitHub issue URLs and discovered feeds with ordinary `fetch`, automatic redirects, and no DNS/private-address checks. Anyone able to create a matching public GitHub issue could bypass frontend intake validation. Public websites could also redirect the crawler to a private endpoint. The crawler executes in a job containing Gmail, OpenAI, and GitHub credentials, which increases the consequence of an internal-service exposure. Credential theft itself was not demonstrated.

`scripts/lib/public-fetch.mjs` now validates HTTP(S) URLs and ports, rejects private/reserved addresses in every DNS answer, pins the connection to the validated address while retaining Host/TLS validation, and rechecks each redirect. A crawl response has a 2 MB stream limit, four-redirect limit, supported text content types, and a 20-second total deadline including DNS and body. Authenticated API calls remain separate. Daily and Toolbox public-source requests use this transport.

Tests cover loopback aliases, mapped IPv6, reserved ranges, mixed DNS, private redirects, DNS pinning, response size, redirect count, unsupported content, and DNS timeout. The approach follows [OWASP's SSRF prevention guidance](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).

### 2. Medium: concurrent requests bypassed submission quotas

The original Worker incremented counters by reading and then writing Workers KV. With simulated network latency, 12 simultaneous requests from one browser created 12 fixture issues and left the counter at 1, bypassing the stated five-per-hour limit. This is consistent with [Cloudflare's documented KV consistency and atomic-operation limitations](https://developers.cloudflare.com/kv/concepts/how-kv-works/).

`SubmissionRateLimit` now uses transactional Durable Object storage. Client and network counters are both reserved before GitHub access, and missing quota infrastructure fails closed. Node regression tests and Cloudflare's actual local SQLite Worker runtime both enforce five browser attempts under concurrency; the network test permits exactly 50 out of 60 attempts with distinct clients. GitHub and Turnstile were mocked, with external networking disabled in the runtime fixture.

The deployment includes the new binding and migration in `submission-worker/wrangler.toml.example`; the former KV namespace and existing secrets were preserved. Counters use shortened identifier hashes and alarm-driven expiry. [Cloudflare's storage documentation](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) describes strong consistency and recovery history; the local privacy text now acknowledges recovery copies for up to 30 days.

### 3. Medium: URL validation accepted sensitive and unsafe destinations

The original shared intake parser accepted `http://[::ffff:127.0.0.1]/article`, the IPv6 unspecified address, shared-address space, custom ports, and embedded username/password credentials. A credential-bearing URL could have been written into a public GitHub issue. Feed canonicalization also accepted executable URL schemes. No successful browser XSS was demonstrated; React's escaping already protects text and blocks JavaScript links.

The shared public URL policy now rejects those cases, and the crawler enforces it independently of the intake. Rendered source/tool links receive the same HTTP(S)-only guard, including historical edition data. Malformed numeric HTML entities no longer throw during feed decoding.

### 4. Medium: malformed requests and incomplete verification checks

A JSON `null` body caused an unhandled exception. Body size and field types were unbounded in application code. Turnstile validation checked only `success`, and a deployment flag could disable verification entirely.

The Worker now validates JSON media type, a streamed 16 KiB body limit, payload shape and field types, and token length. It checks Turnstile's verified hostname against the requesting origin, includes Cloudflare's trusted client IP, removes the bypass flag, and applies upstream timeouts. Authenticated requests use manual redirects and reject non-success responses; this was verified in the Worker runtime because its fetch API does not support Node's `redirect: error`. Responses use `no-store` and `nosniff`. Upstream failures return generic errors.

The server checks follow [Cloudflare's Turnstile validation guidance](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/). Existing secret binding names were verified without printing their values. Production origins now allow only the Pages origin. Widget account settings remain outside this review.

### 5. Medium, setup-only: OAuth callback was not tied to the initiating session

The Gmail helper accepted the first local HTTP request without checking state, path, method, or a valid code. This exposed the one-time setup to callback injection/account mix-up and accidental interruption. It is not a public-site login vulnerability.

The helper now creates random state and an S256 PKCE challenge, validates the callback, ignores unrelated requests, times out after five minutes, and bounds the token exchange. The token verifier stays local. The credential directory/file use restrictive creation permissions. Tests cover wrong/missing state, duplicate state, wrong path, foreign origin, wrong method, and PKCE format. No real account was reauthorized. See [Google's installed-app OAuth guidance](https://developers.google.com/identity/protocols/oauth2/native-app).

### 6. Build/development exposure: known dependency advisories

The initial npm audit reported six affected packages: Vite, PostCSS, Browserslist, nanoid, source-map-js, and baseline-browser-mapping; five were classified high and one moderate by the registry. These classifications do not mean all six were remotely exploitable through the static website. Vite's reported file-access problems concern its development server and Windows-specific paths; the live product is a static build.

Vite is now 6.4.4 and compatible transitive packages are updated in both lockfiles. Both final audits report zero known advisories. `source-map-js >=1.2.2` is explicitly required because pnpm initially retained the vulnerable version. pnpm's installer recorded a version-specific release-age exception for the reviewed Vite security patch; no global age protection was disabled. The resulting lockfile also passed pnpm 10's frozen-lockfile check, matching the deployment workflow.

### 7. Defense in depth: missing browser content policy

The live page had no CSP header or meta policy. Production builds now insert a policy that permits local scripts/assets, the exact configured HTTPS intake origin, and Cloudflare Turnstile. Inline scripts, arbitrary external connections, plugins, base-tag changes, and native form submissions are disallowed. Inline styles remain allowed for existing measured layouts.

Today, Archive, Toolbox, Privacy, private-URL rejection, and opening the review dialog were exercised in the production preview without observed CSP violations. Turnstile's script loaded, but the production widget key rejected localhost (110200); completion of browser verification and a real contribution still require a staging/live check.

## Verification results

- `npm test` in the isolated release: 40 tests passed, zero failures. The earlier 92-test local run also included unpublished private-inspiration tests, which are outside this release.
- `npm run build`: passed with Vite 6.4.4; required Sites files emitted.
- `npm run test:sites`: all four checks passed; the protected Sites Worker/packaging files were not edited.
- `npm run build:pages`: passed, including production CSP.
- `npm audit --json` and `pnpm audit --json`: zero known advisories.
- pnpm 10 frozen-lockfile compatibility: passed.
- Cloudflare Miniflare 4.20260730.0 with the bundled real Worker, SQLite Durable Objects, and mocked upstreams: five accepted and seven rate-limited out of 12 concurrent same-client requests; exactly 50 accepted quota reservations out of 60 for one network bucket.
- `git diff --check`: passed.
- Isolated release browser preview: `http://127.0.0.1:4177/design-daily/`; Today, Archive, Toolbox and Privacy render without observed CSP errors.
- Hardened public fetch smoke test: all four configured public feeds fetched successfully and parsed to 12, 10, 12 and 12 items. No inbox or AI API was accessed.
- Production Worker version `530850dd-cbae-4e85-9e50-dfc72b4460e0` deployed successfully. Previous version: `7cfcdf67-6e8e-41b5-8796-1984b661063a`.
- Nine live Worker checks passed: allowed preflight 204; foreign and localhost origins 403; null and mapped-loopback payloads 400; missing/invalid verification tokens 400; wrong media type 415; oversized body 413. All checked responses use no-store and nosniff.

## Remaining boundaries and rollout

1. **Release verification boundary.** The Worker is deployed and invalid-input paths are verified live; Pages publication follows this commit. A successful real contribution, real OAuth reauthorization, and a full credentialed scheduled crawl have not been performed during this review. Concurrency was verified in the actual local Worker runtime with mocked upstreams, not by production load testing.
2. **Header-only protection is still a hosting limitation.** The meta CSP cannot enforce `frame-ancestors`; the observed Pages response did not include anti-framing or `nosniff` headers. A custom-domain proxy or another host with response-header control is needed for those. No exploit of this low-risk reading surface was demonstrated.
3. **Public issues bypass browser admission controls by design.** GitHub users can create matching issues directly. The new crawler network boundary protects that route too, but quotas on the Worker cannot limit direct GitHub issue creation. Client identifiers can be reset, and users on one network share its cap.
4. **Duplicate checking is not an atomic URL reservation.** Concurrent submissions of the same previously unseen URL can still create duplicates within the enforced quota. Reaching the 2,000-issue scan ceiling now fails closed, rather than silently missing history. A durable canonical-URL index is the next improvement for duplicate correctness and scale.
5. **Untrusted sources can influence editorial output.** The synthesis prompt marks sources as untrusted, uses structured output and known source IDs, has no execution tools, and renders text through React. This reduces code-execution risk but does not prove resistance to editorial misinformation, prompt injection, or cross-source disclosure. The dedicated inbox must stay newsletter-only; human review remains valuable.
6. **Infrastructure controls are only partly verified.** The existing Cloudflare deployment login, secret binding names, origin configuration and Durable Object migration were checked. GitHub token scopes/expiry, branch protection, Actions environment rules, provider retention controls, all historical secrets, and real OAuth end-to-end behavior remain unverified. Workflows still use major-version action tags and broad job-level write permissions; commit pinning and separating crawl/build/deploy jobs are further supply-chain hardening opportunities.

7. **Historical newsletter links can carry tracking identifiers.** Current public edition data includes newsletter redirect URLs with long opaque identifiers. Their exact meaning was not decoded or verified. They may associate clicks with the subscribed inbox. Replace these with canonical publisher links and sanitize crawl output in a follow-up; history already published in Git remains a separate retention concern.

No destructive test, production load test, real article submission, or automatic credential rotation was performed. Existing provider authentication was used for the authorized deployment; secret values were not printed.
