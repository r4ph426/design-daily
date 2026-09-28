# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Durable prototype direction

- Treat `design.md` as the human-readable visual and interaction source of truth for this repository. Keep it aligned with durable design decisions recorded here and with shared tokens in `public/tokens.css`.

- Brand the product exactly as `design / daily`, with the byline `by ra.re design`.
- Use only Neue Reckless and Inter. Neue Reckless is for H1, H2, editorial headings, answer copy, source titles, expressive numerals, and all serif roles. Self-host the Regular, Regular Italic, and Light Italic WOFF2 files. Use Inter for body copy, metadata, and interface roles. Do not introduce a monospace or any third font family.
- Use English for all visible product and interface copy.
- The taxonomy is exactly UI, UX, Process, and Culture. AI is a separate `ai lens`, never a category. Category tags are validated against the same four-value vocabulary and are never free text.
- Never set interface copy in all caps. Use natural English sentence case or title case and never force labels or interface phrases to lowercase. Do not use em dashes as visual separators or in product copy.
- Use `#162713` canvas, `#FF3318` coral, `#F1BF42` yellow, `#B5D2CC` sage, `#E8E8DD` paper, and black through shared CSS tokens. Do not hardcode color literals outside the token source.
- Use Neue Reckless for expressive numerals. Use Inter for body text, interface copy, and metadata.
- Coral is editorial except for the shared `Add to crawl` action on Today and Toolbox. Use sage for other interactive affordances and yellow for focus rings.
- Do not use black backgrounds anywhere in the product. Black can remain a foreground color on yellow or sage when contrast requires it.
- The right rail supports a `Share an article` URL intake. It creates a public GitHub issue that the next scheduled crawl reads as an additional web source.
- The Gmail connection feature is archived in the interface. The product is a shared daily read for a design team of more than 20 UX and UI designers. Keep Gmail authorization, inbox status, and connection copy out of the main frontend; the newsletter inbox remains a server-side source.
- `Share an article` is the primary contribution feature. Accept every valid shared article URL for now; approval and moderation come later.
- Keep article submission anonymous and inside `design / daily`; do not redirect contributors to GitHub. Add spam protection and sensible per-user submission limits without making the flow feel account-gated.
- After a successful submission, confirm that the article was added to the next crawl and name the applicable day or date, such as tomorrow or Monday. Do not promise that the article will be published in the edition.
- Reject duplicate article URLs when they are already queued or appeared in a previous crawl. Explain which case applies; a future iteration may link duplicates to their earlier question or edition in the archive.
- Provide one dedicated team inbox that can be used for new newsletter subscriptions or as a forwarding address for newsletters the team already receives.
- If the editorial seal returns, build it as a live vector element using only Neue Reckless and Inter.
- `See all signals` opens a scrollable archive of previous crawls, organized into UI, UX, Process, and Culture. `Must read` is an editorial filter based on source verdicts and remains separate from team-save popularity.
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
- Render emphasized phrases inside signal tables in coral so the critical insight is visible at a glance.
- Give navigation items and other text links a persistent underline or arrow affordance. On hover, highlight the complete related-read row, not only its text.
- Cap the editorial shell at 1600px and use proportional 14% / 48% / 38% question columns on desktop.
- Use `Today`, `Archive`, and `Toolbox` as the primary header destinations, each with the same persistent active-state logic: subtle surface fill, heavier label, and a three-pixel inset bottom rule. Today and Archive use sage for the rule; Toolbox uses ink. The shared two-row header contains only the brand and date above navigation and the route descriptor; do not add Search, Bookmarks, or other utilities. Search belongs inside Archive. Keep `Question index` as the internal dense-index section heading, and do not repeat Archive in the footer.
- Use edition-aware archive identifiers in `EEE/QQ` format, such as `008/01`, so question numbers remain unique across editions.
- Render the AI lens through one shared compact yellow pill labeled `AI`, with a robot icon, on daily, archive, and question-detail surfaces.
- Keep archive retrieval controls to search, the UI/UX/Process/Culture categories, a `Must read` editorial filter, skill labels, and date. Do not add separate popularity or bookmark view tabs.
- Keep the opening spread text-led, with the daily crawl overview on the left and the article intake on the right. The opening note is a two-line editorial point of view, not a recap. Present questions as compact numbered rows with source provenance and save controls aligned to the grid.
- Use comfortably open display leading for the daily H1 and question titles; do not let multiline editorial headlines feel compressed.
- Stack the article-intake heading, explanatory copy, and URL form vertically. Use `Article intake` in title case, make the H2 explain its contribution to the next crawl, and keep the URL field below the explanatory copy.
- Replace the empty `Further reads` area in expanded signal details with a working `Question trail` link that opens similar questions in the Archive.
- Use a type floor of 11px. Retarget responsive states at 1200px for tablet and 720px for mobile. At mobile size, preserve the date, expose horizontally scrollable category filters, keep search available, and make every interactive target at least 44 by 44px.
- Keep exposed hairline grid rules around major regions. Do not use gradients, rounded SaaS cards, glass effects, or drop shadows.
- Avoid large filled accent panels in the main reading view. Preserve whitespace, subtle green atmospheric texture, strict column alignment, and a compact index-style footer.
- Publish the MVP as a static GitHub Pages site. A scheduled GitHub Actions workflow performs the crawl Monday through Friday, writes versioned JSON editions, and deploys the result. Do not run scheduled crawls on weekends.
- Connect the existing newsletter-only Gmail inbox server-side with read-only Google OAuth. Store OAuth and OpenAI credentials only as GitHub Actions secrets; never expose the inbox address or tokens in the client bundle.
- Treat shared article URLs as accepted for the MVP. Public submissions are GitHub issues that the next scheduled crawl ingests automatically; an approval workflow can replace this later.
- For the Toolbox feature, use the selected editorial verdict-desk layout from the first generated direction: broad opening statement, compact contribution intake, search and verdict filters, and dense evidence-forward tool rows. Use white across the full viewport, including gutters outside the capped editorial shell, with dark or black typography and very subtle neutral grey/black hairline rules. Render the Toolbox masthead brand in the exact Tangity coral token, `#FF3318`. Keep Toolbox navigation white and give the active tab a subtle neutral fill, heavier label, and three-pixel inset ink rule. Use sage only for selected filters and use yellow for verdict highlights and focus. At the 1200px tablet breakpoint, stack the three `New this week` signals vertically. Preserve the existing design / daily grid, Neue Reckless and Inter, and editorial hierarchy. Coral is also used for the `Add to crawl` action and footer claims on this surface. Render expressive tool numerals in a dark high-contrast treatment. Render the primary verdict as black text on a flat yellow background highlight, never with an underline or rounded badge. Toolbox rows do not display the yellow AI tag.
- Structure Toolbox as two connected layers: a date-bound `New this week` editorial section for tools and developments currently sparking the team’s interest, followed by a persistent `Our toolbox` collection of tested tools the team should or could use now. Search, category filters, verdict filters, and best-practice retrieval belong to the persistent collection. Weekly discoveries may later graduate into `Our toolbox`, but the two layers stay visibly distinct.
- Use one contribution language and control anatomy across Today and Toolbox: `Contribute to the next crawl`, contextual URL labels, and `Add to crawl`. Keep the 48px square-edged field/action pair, focus behavior, and mobile stacking consistent; only the contextual surface fill changes.
- Preserve the shared two-row header as one component. At mobile width, show the edition date in compact `D Mon YYYY` form so it never collides with the brand.
- Use one shared page-opening contract on Today, Archive, and Toolbox: eyebrow on every page, 64% / 36% desktop split, 360px minimum height, identical editorial and aside insets, 64px desktop title, 17px summary, and the same stacked mobile treatment. Page color and secondary-panel content may differ; page-specific hero geometry and type scales may not.
- End every route with the same three-cell footer anatomy: `AI-generated. Human-edited.`, the underlined `Privacy` link with arrow, and `Synthesis, not noise.` in coral. Today and Archive use the dark forest treatment with a sage Privacy link. Toolbox uses the same footer in its white light theme with neutral rules, a contrast-safe darker coral for the claims, and an ink Privacy link. Do not replace it with route-specific metadata.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
