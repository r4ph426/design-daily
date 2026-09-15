# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Durable prototype direction

- Brand the product exactly as `design / daily`, with the byline `by ra.re design`.
- Use Neue Reckless for H1, H2, editorial headings, answer copy, expressive numerals, and all serif roles. Self-host the Regular, Regular Italic, and Light Italic WOFF2 files. Use Inter from Google Fonts for body copy and a system monospace stack for metadata and interface roles.
- Use English for all visible product and interface copy.
- The taxonomy is exactly UI, UX, Process, and Culture. AI is a separate `ai lens`, never a category. Category tags are validated against the same four-value vocabulary and are never free text.
- Never set interface copy in all caps. Do not use em dashes as visual separators or in product copy.
- Use `#162713` canvas, `#FF3318` coral, `#F1BF42` yellow, `#B5D2CC` sage, `#E8E8DD` paper, and black through shared CSS tokens. Do not hardcode color literals outside the token source.
- Use Neue Reckless for expressive numerals. Use Inter for body text and a system monospace stack for all interface copy and metadata.
- Coral is editorial only: the masthead, question numerals, and `why it matters` label. Use sage for interactive affordances and yellow for focus rings.
- The right rail supports a `Share an article` URL intake. It creates a public GitHub issue that the next scheduled crawl reads as an additional web source.
- The Gmail connection feature is archived in the interface. The product is a shared daily read for a design team of more than 20 UX and UI designers. Keep Gmail authorization, inbox status, and connection copy out of the main frontend; the newsletter inbox remains a server-side source.
- `Share an article` is the primary contribution feature. Accept every valid shared article URL for now; approval and moderation come later.
- Provide one dedicated team inbox that can be used for new newsletter subscriptions or as a forwarding address for newsletters the team already receives.
- Build the editorial seal as a live vector element. Its center is the lowercase `dd` monogram set in Clash Display.
- `See all signals` opens a scrollable archive of previous crawls, organized into UI, UX, Process, and Culture. Must reads are elevated through team saves and community feedback.
- Give all compact CTAs that reveal more signals or sources one consistent sage treatment.
- Preserve strict editorial alignment, oversized issue numbers, and dense source-forward information hierarchy. Do not render decorative grid lines in the page background. Major content regions and question rows retain subtle hairline outlines.
- The latest visual source of truth replaces the image-led cobalt landing composition with a restrained dark forest-green editorial index. Use warm off-white Neue Reckless display type for editorial headlines and question titles, Inter for body copy, system mono for interface copy, hairline olive outlines around major content regions, and vivid signal red as the editorial accent.
- Place the `why it matters` eyebrow directly above each question answer and render the answer slightly larger. The disclosure beneath it is named `Signals & Sources` and reveals extended signal notes and related reads inside its own subtle outline.
- Keep the opening title and summary text boxes broad enough for roughly 10 to 12 words per line, with body-copy measure capped around 60 characters.
- Set question numbers in Neue Reckless Light Italic. Source provenance metadata and compact controls respect the 11px type floor.
- Render non-interactive footer statements in muted paper tones. Do not use editorial coral for controls or utility text.
- Keep source links permanently visible in the provenance column with title, domain, source type, and time. Reserve the disclosure for extended signal notes and related reads.
- Cap the editorial shell at 1600px and use proportional 14% / 48% / 38% question columns on desktop.
- Place the Question index alongside UI, UX, Process, and Culture in the header. Do not repeat the category list or the Question index in the footer.
- Keep the opening spread text-led, with the daily crawl overview on the left and the article intake on the right. The opening note is a two-line editorial point of view, not a recap. Present questions as compact numbered rows with source provenance and save controls aligned to the grid.
- Use a type floor of 11px. Retarget responsive states at 1200px for tablet and 720px for mobile. At mobile size, preserve the date, expose horizontally scrollable category filters, keep search available, and make every interactive target at least 44 by 44px.
- Keep exposed hairline grid rules around major regions. Do not use gradients, rounded SaaS cards, glass effects, or drop shadows.
- Avoid large filled accent panels in the main reading view. Preserve whitespace, subtle green atmospheric texture, strict column alignment, and a compact index-style footer.
- Publish the MVP as a static GitHub Pages site. A scheduled GitHub Actions workflow performs the crawl Monday through Friday, writes versioned JSON editions, and deploys the result. Do not run scheduled crawls on weekends.
- Connect the existing newsletter-only Gmail inbox server-side with read-only Google OAuth. Store OAuth and OpenAI credentials only as GitHub Actions secrets; never expose the inbox address or tokens in the client bundle.
- Treat shared article URLs as accepted for the MVP. Public submissions are GitHub issues that the next scheduled crawl ingests automatically; an approval workflow can replace this later.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
