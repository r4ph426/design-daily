# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Durable prototype direction

- Brand the product exactly as `design / daily`, with the byline `by ra.re design`.
- Use only Neue Reckless and Inter. Neue Reckless is for H1, H2, editorial headings, answer copy, source titles, expressive numerals, and all serif roles. Self-host the Regular, Regular Italic, and Light Italic WOFF2 files. Use Inter for body copy, metadata, and interface roles. Do not introduce a monospace or any third font family.
- Use English for all visible product and interface copy.
- The taxonomy is exactly UI, UX, Process, and Culture. AI is a separate `ai lens`, never a category. Category tags are validated against the same four-value vocabulary and are never free text.
- Never set interface copy in all caps. Use natural English sentence case or title case and never force labels or interface phrases to lowercase. Do not use em dashes as visual separators or in product copy.
- Use `#162713` canvas, `#FF3318` coral, `#F1BF42` yellow, `#B5D2CC` sage, `#E8E8DD` paper, and black through shared CSS tokens. Do not hardcode color literals outside the token source.
- Use Neue Reckless for expressive numerals. Use Inter for body text, interface copy, and metadata.
- Coral is editorial only: the masthead, question numerals, the `Why it matters` label, and non-interactive footer claims. Use sage for interactive affordances and yellow for focus rings.
- Do not use black backgrounds anywhere in the product. Black can remain a foreground color on yellow or sage when contrast requires it.
- The right rail supports a `Share an article` URL intake. It creates a public GitHub issue that the next scheduled crawl reads as an additional web source.
- The Gmail connection feature is archived in the interface. The product is a shared daily read for a design team of more than 20 UX and UI designers. Keep Gmail authorization, inbox status, and connection copy out of the main frontend; the newsletter inbox remains a server-side source.
- `Share an article` is the primary contribution feature. Accept every valid shared article URL for now; approval and moderation come later.
- Keep article submission anonymous and inside `design / daily`; do not redirect contributors to GitHub. Add spam protection and sensible per-user submission limits without making the flow feel account-gated.
- After a successful submission, confirm that the article was added to the next crawl and name the applicable day or date, such as tomorrow or Monday. Do not promise that the article will be published in the edition.
- Reject duplicate article URLs when they are already queued or appeared in a previous crawl. Explain which case applies; a future iteration may link duplicates to their earlier question or edition in the archive.
- Provide one dedicated team inbox that can be used for new newsletter subscriptions or as a forwarding address for newsletters the team already receives.
- If the editorial seal returns, build it as a live vector element using only Neue Reckless and Inter.
- `See all signals` opens a scrollable archive of previous crawls, organized into UI, UX, Process, and Culture. Must reads are elevated through team saves and community feedback.
- Replace the Question index modal with a dedicated, shareable hybrid archive page. Lead with a compact editorial `Start here` area for junior designers, then hand off to a dense searchable index for repeat retrieval. Rank overall popularity by all-time team saves, expose the save count transparently, and add a separate `Popular recently` signal when a question gains at least three distinct team saves in the trailing 30 days. Keep both signals separate from editorially selected foundational reading.
- Count editions from the first live publication, not from the prototype seed. Thursday, 10 September 2026 is Edition 001; increment once for each actual published weekday edition, preserve the number on same-day reruns, and do not create weekend gaps.
- Give all compact CTAs that reveal more signals or sources one consistent sage treatment.
- Preserve strict editorial alignment, oversized issue numbers, and dense source-forward information hierarchy. Do not render decorative grid lines in the page background. Major content regions and question rows retain subtle hairline outlines.
- The latest visual source of truth replaces the image-led cobalt landing composition with a restrained dark forest-green editorial index. Use warm off-white Neue Reckless display type for editorial headlines and question titles, Inter for body and interface copy, hairline olive outlines around major content regions, and vivid signal red as the editorial accent.
- Place the `why it matters` eyebrow directly above each question answer and render the answer slightly larger. The disclosure beneath it is named `Signals & Sources` and reveals extended signal notes and related reads inside its own subtle outline.
- Keep the opening title and summary text boxes broad enough for roughly 10 to 12 words per line, with body-copy measure capped around 60 characters.
- Set question numbers in Neue Reckless Light Italic. Source provenance metadata and compact controls respect the 11px type floor.
- Render non-interactive footer statements in signal red. Keep interactive footer links sage with a visible underline or arrow affordance.
- Keep source links permanently visible in the provenance column with title, domain, source type, and time. Reserve the disclosure for extended signal notes and related reads.
- Mark external source links with the same `↗` affordance used by the Archive navigation item.
- Apply the same subtle full-row hover surface used by Further reads to question content regions, source rows, and interactive footer cells.
- Clicking anywhere in a question content region toggles its Signals & Sources details. Keep the explicit title and disclosure buttons keyboard accessible and prevent nested controls from toggling twice.
- Present the article intake as an editorial H2 without a decorative link icon. Its heading should explain that a submitted URL contributes to the next crawl.
- Show the crawl date beside its time as `today`, `yesterday`, or `DD,MM,YYYY`.
- Replace the generic shared-team crawl note with a crawl breakdown showing total items, configured web sources, and team-contributed links.
- Place the personal question bookmark on its own labeled row using `Bookmark question for me`.
- In expanded signal tables, show the article title, publisher, source type, and time in the Source column. Write both `What happened` and `What changes` as two to four sentences. Make `What changes` critical by connecting causes, consequences, and tradeoffs, and emphasize the main insight or one important phrase.
- Give navigation items and other text links a persistent underline or arrow affordance. On hover, highlight the complete related-read row, not only its text.
- Cap the editorial shell at 1600px and use proportional 14% / 48% / 38% question columns on desktop.
- Place `Archive` alongside UI, UX, Process, and Culture in the header. Keep `Question index` as the internal dense-index section heading, and do not repeat the category list or Archive in the footer.
- Keep the opening spread text-led, with the daily crawl overview on the left and the article intake on the right. The opening note is a two-line editorial point of view, not a recap. Present questions as compact numbered rows with source provenance and save controls aligned to the grid.
- Use a type floor of 11px. Retarget responsive states at 1200px for tablet and 720px for mobile. At mobile size, preserve the date, expose horizontally scrollable category filters, keep search available, and make every interactive target at least 44 by 44px.
- Keep exposed hairline grid rules around major regions. Do not use gradients, rounded SaaS cards, glass effects, or drop shadows.
- Avoid large filled accent panels in the main reading view. Preserve whitespace, subtle green atmospheric texture, strict column alignment, and a compact index-style footer.
- Publish the MVP as a static GitHub Pages site. A scheduled GitHub Actions workflow performs the crawl Monday through Friday, writes versioned JSON editions, and deploys the result. Do not run scheduled crawls on weekends.
- Connect the existing newsletter-only Gmail inbox server-side with read-only Google OAuth. Store OAuth and OpenAI credentials only as GitHub Actions secrets; never expose the inbox address or tokens in the client bundle.
- Treat shared article URLs as accepted for the MVP. Public submissions are GitHub issues that the next scheduled crawl ingests automatically; an approval workflow can replace this later.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
