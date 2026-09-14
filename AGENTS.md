# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Durable prototype direction

- Brand the product exactly as `design / daily`, with the byline `by ra.re design`.
- Use Clash Display for H1, H2, headings, and the masthead. Use Geist Mono from Google Fonts for body and interface typography. Use Geist Pixel for expressive numbers, metadata, labels, and compact utility controls.
- Never set interface copy in all caps. Do not use em dashes as visual separators or in product copy.
- Use flat cobalt as the secondary accent. Avoid broad lavender fields; reserve a saturated flieder accent for compact discovery CTAs that open more signals or sources.
- Reserve Geist Pixel for short single-line header metadata. Use Clash Display for expressive numerals and Geist Mono for other small interface text.
- Do not place orange text or controls on cobalt panels. Use #131313 for secondary actions and dark accents on cobalt.
- The right rail supports newsletter URL intake: a subscription agent uses a dedicated private inbox to subscribe, then received issues enter the daily crawl.
- The Gmail connection feature is archived. The product is a shared daily read for a design team of more than 20 UX and UI designers.
- `Add a newsletter` is the primary contribution feature. Accept every suggested newsletter for now; approval and moderation come later.
- Provide one dedicated team inbox that can be used for new newsletter subscriptions or as a forwarding address for newsletters the team already receives.
- Build the editorial seal as a live vector element. Its center is the lowercase `dd` monogram set in Clash Display.
- `See all signals` opens a scrollable archive of previous crawls, organized into Practice, Process, and Culture. Must reads are elevated through team saves and community feedback.
- Give all compact CTAs that reveal more signals or sources one consistent, high-contrast flieder treatment.
- Preserve the selected cobalt/black/lavender/coral visual direction, exposed editorial grid, strong image field, oversized issue numbers, and dense source-forward information hierarchy.
- The latest visual source of truth replaces the image-led cobalt landing composition with a restrained dark forest-green editorial index. Use warm off-white serif display type for editorial headlines and question titles, Geist Mono for interface copy, hairline olive grid rules, and vivid signal red as the primary accent.
- Keep the opening spread text-led, with the daily crawl overview on the left and the newsletter intake on the right. Present questions as compact numbered rows with source provenance and save controls aligned to the grid.
- Avoid large filled accent panels in the main reading view. Preserve whitespace, subtle green atmospheric texture, strict column alignment, and a compact index-style footer.
- Publish the MVP as a static GitHub Pages site. A scheduled GitHub Actions workflow performs the crawl Monday through Friday, writes versioned JSON editions, and deploys the result. Do not run scheduled crawls on weekends.
- Connect the existing newsletter-only Gmail inbox server-side with read-only Google OAuth. Store OAuth and OpenAI credentials only as GitHub Actions secrets; never expose the inbox address or tokens in the client bundle.
- Treat newsletter suggestions as accepted for the MVP. Public submissions are GitHub issues that the next scheduled crawl ingests automatically; an approval workflow can replace this later.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
