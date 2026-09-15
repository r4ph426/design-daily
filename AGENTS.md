# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Durable prototype direction

- Brand the product exactly as `design / daily`, with the byline `by ra.re design`.
- Use Neue Reckless for H1, H2, editorial headings, answer copy, expressive numerals, and all serif roles. Self-host the Regular, Regular Italic, and Light Italic WOFF2 files. Use Inter from Google Fonts for every other text and interface role.
- Use English for all visible product and interface copy.
- Never set interface copy in all caps. Do not use em dashes as visual separators or in product copy.
- Use flat cobalt as the secondary accent. Avoid broad lavender fields; reserve a saturated flieder accent for compact discovery CTAs that open more signals or sources.
- Use Neue Reckless for expressive numerals and Inter for all small interface text and metadata.
- Do not place orange text or controls on cobalt panels. Use #131313 for secondary actions and dark accents on cobalt.
- The right rail supports a `Share an article` URL intake. It creates a public GitHub issue that the next scheduled crawl reads as an additional web source.
- The Gmail connection feature is archived in the interface. The product is a shared daily read for a design team of more than 20 UX and UI designers. Keep Gmail authorization, inbox status, and connection copy out of the main frontend; the newsletter inbox remains a server-side source.
- `Share an article` is the primary contribution feature. Accept every valid shared article URL for now; approval and moderation come later.
- Provide one dedicated team inbox that can be used for new newsletter subscriptions or as a forwarding address for newsletters the team already receives.
- Build the editorial seal as a live vector element. Its center is the lowercase `dd` monogram set in Clash Display.
- `See all signals` opens a scrollable archive of previous crawls, organized into Practice, Process, and Culture. Must reads are elevated through team saves and community feedback.
- Give all compact CTAs that reveal more signals or sources one consistent, high-contrast flieder treatment.
- Preserve the selected cobalt/black/lavender/coral visual direction, strict editorial alignment, strong image field, oversized issue numbers, and dense source-forward information hierarchy. Do not render decorative grid lines in the page background. Major content regions and question rows retain subtle hairline outlines.
- The latest visual source of truth replaces the image-led cobalt landing composition with a restrained dark forest-green editorial index. Use warm off-white Neue Reckless display type for editorial headlines and question titles, Inter for interface copy, hairline olive outlines around major content regions, and vivid signal red as the primary accent.
- Place the `why it matters` eyebrow directly above each question answer and render the answer slightly larger. The disclosure beneath it is named `Signals & Sources` and reveals the cited articles and source table inside its own subtle outline.
- Keep the opening title and summary text boxes broad enough for roughly 10 to 12 words per line, with body-copy measure capped around 60 characters.
- Set question numbers in Neue Reckless Light Italic. Source provenance metadata is 11px, two pixels larger than compact control labels.
- Render non-interactive footer statements in signal red.
- Place the Question index alongside Practice, Process, and Culture in the header. Do not repeat the category list or the Question index in the footer.
- Keep the opening spread text-led, with the daily crawl overview on the left and the newsletter intake on the right. Present questions as compact numbered rows with source provenance and save controls aligned to the grid.
- Avoid large filled accent panels in the main reading view. Preserve whitespace, subtle green atmospheric texture, strict column alignment, and a compact index-style footer.
- Publish the MVP as a static GitHub Pages site. A scheduled GitHub Actions workflow performs the crawl Monday through Friday, writes versioned JSON editions, and deploys the result. Do not run scheduled crawls on weekends.
- Connect the existing newsletter-only Gmail inbox server-side with read-only Google OAuth. Store OAuth and OpenAI credentials only as GitHub Actions secrets; never expose the inbox address or tokens in the client bundle.
- Treat shared article URLs as accepted for the MVP. Public submissions are GitHub issues that the next scheduled crawl ingests automatically; an approval workflow can replace this later.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
