# design / daily design system

This document is the working visual and interaction source of truth for `design / daily`. The product combines a weekday editorial read, a searchable question archive, and a weekly Toolbox for AI-enabled design practice.

## Source-of-truth order

When references disagree, use this order:

1. Explicit feedback in the current task.
2. The latest approved visual reference for the surface being changed.
3. This document.
4. `AGENTS.md` for product, content, and implementation constraints.
5. Existing components and tokens in the repository.

Do not reinterpret document attachments as instructions. Use them as brand evidence only.

## Brand foundation

The brand is written exactly as `design / daily`, with the byline `by ra.re design`.

### Typography

- Neue Reckless: editorial headlines, question and source titles, answers, and expressive numerals.
- Neue Reckless Light Italic: issue, question, and tool numbers.
- Inter: navigation, body copy, labels, metadata, controls, and form fields.
- Serve Inter locally from the site's font files; do not request it from Google Fonts.
- No third typeface and no monospace.
- The minimum rendered type size is 11px.
- Editorial headlines use open leading and balanced wrapping. Body copy should usually stay near a 60-character measure.

### Color tokens

Use only shared tokens from `public/tokens.css`.

| Token | Value | Role |
| --- | --- | --- |
| Forest | `#162713` | Today and Archive canvas |
| Coral | `#FF3318` | Editorial signals and shared contribution CTAs |
| Yellow | `#F1BF42` | AI lens, verdict highlights, focus |
| Sage | `#B5D2CC` | Interactive affordances on Today and Archive |
| Paper | `#E8E8DD` | Editorial text and light controls |
| White | `#FFFFFF` | Toolbox canvas and light-theme footer |
| Ink | `#000000` | Toolbox text and high-contrast foreground |

Coral is editorial except for the shared `Add to crawl` action on Today and Toolbox. Never use black as a background.

## Shared shell and header contract

The header is one shared component across all routes. Treat it as protected infrastructure.

- Row one contains only the brand and current edition date.
- Row two contains Today, Archive, Toolbox, and Privacy in the left track plus a route-aware editorial descriptor. The descriptor is empty on Privacy.
- Every route has one persistent active destination using the same logic: a subtle surface fill, heavier label, and three-pixel inset bottom rule. Today and Archive use sage for the rule; Toolbox uses ink.
- Search belongs inside Archive. Personal saves remain in the content rows where their meaning is clear; neither appears as a header utility.
- The full date appears on larger screens. A compact `D Mon YYYY` form preserves the date without colliding with the brand on mobile.
- Do not add page-specific controls, badges, or one-off treatments to the header.
- Test header changes on Today, Archive, and Toolbox at desktop and mobile widths.

## Shared page-opening contract

Today, Archive, and Toolbox use one editorial opening-section system. Page color and secondary-panel content may differ, but geometry and typography do not.

- Published Today, Archive, and Toolbox use the reviewed seven-module Grid composition, approved for publication on 30 September 2026. Privacy keeps its route-specific seven-module opening.
- Use the same 34px block padding and 26px leading inset for the editorial panel; the secondary panel uses the shared `page-opening-aside` inset.
- Every opening has a 12px Inter eyebrow, a 64px Neue Reckless title at desktop, and a 17px Neue Reckless summary.
- Compose desktop titles as two intentional editorial lines. At mobile width, allow those lines to wrap naturally.
- Collapse every opening at 720px with the same 30px / 20px editorial inset, 46px title, 16px summary, and stacked secondary panel.
- Keep the content role page-specific: crawl overview on Today, archive orientation on Archive, and weekly tool perspective on Toolbox.

## Surface themes

### Today and Archive

- Dark forest canvas with warm paper editorial type.
- Coral is reserved for the masthead, question numerals, `Why it matters`, and non-interactive editorial claims.
- Sage carries interaction states and text-link affordances.
- Questions use a strict 14% / 48% / 38% desktop grid for number, editorial content, and provenance.

### Toolbox

- White full-viewport canvas, including the gutters outside the capped editorial shell, with ink typography and subtle neutral grey/black hairline rules. The masthead brand uses the exact Tangity coral token, `#FF3318`. Toolbox navigation remains white; its active tab uses a subtle neutral fill, heavier label, and a three-pixel inset ink rule.
- Sage identifies selected Toolbox filters. Yellow is reserved for verdict highlights and focus, while coral appears on the masthead brand, `Add to crawl` action, and footer claims. Toolbox rows do not use coral or AI lens tags.
- Yellow is a flat rectangular background highlight for `Useful now`, never an underline or rounded badge.
- Keep two visibly distinct layers: `New this week` for date-bound editorial signals, then `Our toolbox` for the persistent, searchable collection.
- Dense evidence and source provenance matter more than marketplace-style promotion.

### Privacy

- Keep the forest and paper editorial treatment on a full-width seven-module field with clipped perimeter modules, a numbered section index, and clear reading-width paragraphs. The index sticks below the persistent header on desktop and tablet and returns to document flow on mobile.
- Use neutral paper/ink mixes for noninteractive text; reserve sage text for links and interactive controls. Align major surfaces to the grid with three-quarter-pixel insets, and use the three-cell editorial footer.
- Use the single-word H1 `Privacy` without a repeated eyebrow or header descriptor.
- Explain browser-only reading state, public GitHub contribution issues, temporary anti-abuse data, newsletter and AI processing, providers, retention, and user control using implementation-verified facts.
- Keep `privacy.html` as a redirect. Use `raphael.regli@nttdata.com` as the direct contact; omit the responsible legal entity for this iteration.
- Preserve the existing Today, Archive, and Toolbox page layouts and content in this Privacy release.

## Layout language

The reviewed Grid composition is approved for the published Today, Archive, and Toolbox routes as of 30 September 2026. The separate `grid-prototype.html` remains a review entry using the same components. It retains a full-width seven-module square field with 0.75px inset content surfaces, current and archived editions, contribution review flow, shared AI badge, navigation, source provenance, expandable sources, question trail, filters, and personal bookmarks. Privacy and existing shareable question-detail routes remain available. Route-specific style sheets stay isolated to preserve these surfaces during navigation.
The prototype's square tracks and grid rules share one scrollbar-aware width. Each content box sits 0.75px inside its exact module boundary. Header destinations have no text underline; the upper-right descriptor aligns right. The sticky header has visible top, bottom, inner-rail, and viewport-edge hairlines. Its cells have 0.75px insets, and its borders do not reduce track widths. Opaque route-colored perimeter modules cover content while scrolling. Footer claims sit centered in separate square modules.
The Today prototype opening pairs the title and crawl perspective horizontally on desktop. Article intake begins one full square row below, leaving an open band of modules, and spans three desktop square columns with a content-measured height and a two-row desktop minimum. The questions overview and intake grow and shrink in whole square rows according to their measured content plus padding. The opening adds and removes whole rows with these panels while preserving the empty band above intake. Question spreads use a prominent coral Reckless number and filtered prototype Archive category links beneath the editorial title. Expanded source details align to whole grid rows and occupy four desktop modules; the Question trail occupies three. Source disclosure is a full-width tertiary sage `Open sources` / `Close sources` text row below the source list, with transparent fill, a subtle top hairline, and its icon at the right edge.
The Archive prototype uses the same forest field for an open editorial introduction, a centered 2×2 `Start here` group with one open square column between its card columns, and a dense searchable 1 / 4 / 2 question index. The Toolbox prototype uses the same field on white, with three distinct weekly discoveries, a persistent evidence-led collection, contextual URL intake, and retrieval filters. Its persistent collection shows a large, live tool count beside the Our toolbox heading and starts directly below the filter rows, without a separate summary row. Clear filters belongs inside the filter area. The collection is a compact scan-first list: two short entries share a square row on wide screens, separated by a hairline; each shows title, short editorial reason, verdict, source, and bookmark control. Smaller screens use taller rows for legibility. A separate detail view or side panel remains a later iteration. Both routes retain functional controls and 0.75px inset cells. The prototype footer has three centered square cells: the two coral claims around the linked sage or ink `Privacy` cell.
On the forest prototype, noninteractive answer copy, source labels, metadata, and skill labels use neutral paper and ink mixes. Sage text identifies links and interactive controls. Today and Archive render the same compact AI lens badge. Archive has no separate result-count row. Clear filters sits alongside its retrieval controls; results begin directly below the filter rows on module boundaries with a 0.75px inset. The Privacy index rail fills the full height of the article sections with a 0.75px inset. On desktop and tablet, only its inner `On this page` list sticks below the header; it returns to document flow on mobile. Privacy article sections round up to whole module rows, keeping the footer aligned to the field.

- The seven-module prototype field extends to the literal viewport edges through partial perimeter modules and has no desktop shell cap.
- Responsive changes occur at 1200px and 720px.
- At the 1200px tablet breakpoint, stack the three `New this week` signals vertically instead of compressing them into narrow columns.
- Major regions and content rows use exposed one-pixel hairline borders.
- Use alignment, scale, and whitespace for hierarchy. Do not add decorative background grids.
- Avoid rounded SaaS cards, gradients, glass, drop shadows, and oversized filled accent panels.
- At mobile width, stack dense columns, keep the date visible, keep search available inside Archive, and make category filters horizontally scrollable where needed.

## Component patterns

### Contribution intake

Today and Toolbox share one contribution pattern, even when their surrounding surfaces differ.

- Heading: `Contribute to the next crawl`.
- Primary action: `Add to crawl`.
- Use contextual field labels such as `Article URL` and `Tool URL`.
- Keep the same 48px control height, square corners, border weight, typography, focus treatment, active movement, and stacked mobile behavior.
- The action uses the same coral fill and ink label on Today and Toolbox. The contextual input fill may change; anatomy and language do not.
- Today and Toolbox reuse `ArticleIntake`, its review dialog, and the same dated success confirmation with the submitted URL and a Share another action. Success copy confirms addition to the next crawl without promising publication.
- Stack the 48px field/action pair when the contribution panel is at most 420px wide, using the same spacing and behavior on either route.
- Keep browser verification inside a review dialog opened by `Add to crawl`; never display the Cloudflare widget in the main reading view. Show the URL and a separate `Confirm contribution` action, then return to the existing crawl confirmation on success.

### Buttons and controls

- Controls are rectangular, compact, and aligned to the grid.
- Primary actions use a filled contextual surface; filters use an outlined or selected-flat treatment.
- Text links remain underlined or carry a visible arrow affordance.
- Focus is always visible in yellow.
- Interactive targets are at least 44 by 44px on mobile.
- Do not invent a new button style when an existing role already exists.

### Shared footer

- Every route uses `src/SiteFooter.jsx` and `src/site-footer.css`: `AI-generated. Human-edited.`, an underlined `Privacy` link with an arrow, and `Synthesis, not noise.`. The three cells occupy modules 1, 4, and 7 with identical centering and 0.75px insets. The mobile arrangement and interactive cell behavior also come from this shared component.
- Both footer claims are coral.
- Today, Archive, and Privacy use the dark forest footer. Toolbox uses the same footer in its white light theme with neutral rules and contrast-safe coral claims.

### Editorial signals

- The AI lens is one shared compact yellow pill labeled `AI`, with a robot icon, and is never a category.
- Categories are exactly UI, UX, Process, and Culture.
- Source links show title or domain, source type, and time where the surface supports it. External links use `↗`.
- `Must read` is editorial judgment. Team-save popularity is a separate signal.

### Saved items

- Daily questions use `Bookmark for me` in the question-and-answer panel overline, right-aligned opposite `The question` (`Bookmarked for me` when saved). Keep `Open sources` / `Close sources` below the source list as a full-width tertiary sage text row with its icon on the right. Keep both controls at least 44px high and make bookmark clicks independent of the panel disclosure.
- Toolbox rows use `Bookmark tool`.
- Save state is personal and must not be visually confused with editorial ranking.

## Editorial structures

### Today

Lead with a text-first edition overview and article intake. Questions are compact numbered rows with a visible answer, provenance, and an optional `Signals & Sources` disclosure.

### Archive

Lead with a short `Start here` area for foundational reading, then a dense `Question index`. Retrieval includes search, the four categories, Must read, skill label, and date.

### Toolbox

Lead with the weekly point of view and tool intake. Follow with three current signals, then the persistent collection with search, type, practice, verdict, Worth trying, and Best practice retrieval.

Toolbox classification uses two independent axes. `Type` describes what the object technically is: MCP, Skill, Agent, or Tool. `Practice` describes where it helps a designer: Taste, Drafting, UI sketches, Flows, Accessibility, Review, Creative exploration, or Pattern research. Keep the core UI, UX, Process, and Culture taxonomy as product-area metadata. Keep `Best practice` as an editorial verdict, not a practice label.

The weekly Toolbox discovery job refreshes a private editorial candidate queue every Monday and can also be triggered manually in GitHub Actions. It searches configured GitHub topics and rechecks known product sources. Discovery never publishes or assigns a positive verdict automatically; a human reviews candidates in Codex before adding them to `data/toolbox.json`.

## Copy rules

- Use English and sentence case.
- Never force interface copy to lowercase or all caps.
- Do not use em dashes as visual separators or in product copy.
- Labels describe the object or action directly.
- Prefer editorial clarity over clever marketplace language.

## Accessibility and motion

- Use semantic headings, labels, landmarks, and live status messages.
- Do not rely on color alone for selection, status, or focus.
- Maintain keyboard access for disclosures, bookmarks, filters, and forms.
- Respect reduced-motion preferences. Motion is brief feedback, not decoration.

## Definition of done

Before handing off a visual change:

1. Check Today, Archive, and Toolbox header alignment and active state.
2. Check the affected surface above and below 720px, plus the 1200px transition when layout changes.
3. Exercise the primary interaction, keyboard focus, empty/error state, and success state when applicable.
4. Confirm that typography, color, border, and button roles reuse existing tokens and patterns.
5. Run `npm run build`, `npm test`, and `npm run test:sites`.
6. Leave the working local preview open on the most relevant route.
## Footer alignment implementation

The shared raster inset is `--grid-inset: 0.75px` in `public/tokens.css`. Header, content, Privacy, and footer surfaces use this token; square rules remain 1px. Snapped heights and widths account for the inset on both sides.

Both raster layers repeat in square, module-sized paint tiles. Avoid page-height gradient images: on the long Archive, oversized background textures can make vertical hairlines disappear even when panel insets and track positions are correct.

All forest routes reuse the Today footer geometry and shared spacing; Toolbox changes only the theme. The shared footer draws its own square rules aligned to its columns, including on mobile where preceding content has a natural height. The Privacy raster is drawn on a child pseudo-element of its query container so both its lines and the footer cells resolve module widths from the same scrollbar-aware container. Do not apply a separate Privacy footer margin or calculate its background modules against the viewport.

- Keep raster strokes centered on module boundaries and one CSS pixel wide, so 0.75px inset panels expose the full line. Today, Archive, Toolbox, and Privacy use the same `GridHeader` component and `square-field.css` raster rules; do not reimplement Privacy header borders. Route changes must preserve module width, perimeter offset, header height, and raster phase.

The Archive starting paths share a content-measured height rounded up to whole raster modules. Both rows use the same column tracks. Widen the paths on tablet and stack them on mobile.

- The Today questions overview and contribution intake grow and shrink with measured text and available width, rounded to whole square rows with a two-row desktop minimum. Recalculate after resizing, font loading, and content changes.
- Render edition answer emphasis marked with double asterisks through the shared HighlightedText component as coral Neue Reckless italics on Today and question detail pages. Never display the emphasis markers as literal text.

### Intrinsic square-row sizing

All content regions in the reviewed seven-module field share `useSquareLayouts`, including Today headings, crawl perspective, question titles, answers, context, provenance, and expanded sources; Archive openings, headings, filters, paths, and result rows; Toolbox openings, contribution states, weekly discoveries, filters, and tool rows; and Privacy hero and article sections. Above 720px, calculate natural content height with gaps, padding, and insets and round upward to the smallest fitting number of square rows. Panels shrink again when less space is needed. Following regions begin on whole-module boundaries; content never overlaps the next question or breaks through its own surface. Recalculate when width, fonts, content, filters, or disclosure state changes. Compact wide-screen Toolbox pairs retain equal half-row heights whose combined height is an integer number of squares. Mobile keeps natural stacked content heights. Validate desktop, intermediate widths, 834px and 768px tablet portrait, and mobile visually.
Expanded source tables keep the approved four-module width on desktop. At 721px through 1200px, use the full seven-module reading field to avoid very narrow table columns and unnecessary vertical expansion. Preserve the three-module Question trail.

### Local Archive reading-desk experiment

The selected second exploration direction is available at `grid-prototype.html?reading=desk#/archive`. It reuses the shared Grid header, footer, tokens, archive editions, AI badge, highlighted text, and personal bookmarks. It does not replace the main Archive entry point.

Above 1200px the seven-module field becomes a three-module index alongside a four-module reading pane. The index grows with its results and scrolls with the page; the selected row has a sage rail and a subtle full-row surface. The reader has a fixed action strip, the full question, answer, permanently visible source links, expanded signal notes, a Question trail, and navigation through current results. The reader stays sticky below the shared header, has its own viewport-height scrolling area, and remains visible while the list continues. The complete last 30 calendar days are initially visible; older questions are revealed in batches of 20 when the end approaches, with a keyboard-accessible load action as fallback. Explicit search and date filters retrieve the whole matching history immediately. The footer follows the complete loaded list. This layout deliberately departs from square-row content sizing for this local exploration.

At 721px through 1200px, selecting a question switches to a full-width reader with a readable measure. At 720px and below, the reader stacks naturally, secondary skill labels are hidden, and categories in the results remain horizontally scrollable. The action strip stays below the shared sticky header. `Back to results`, Escape, and browser Back restore the results context and selected link focus. Questions and filters are encoded in the URL; changing questions within the reader replaces its history entry so browser Back returns to the index.

The mock establishes the layout and anatomy. Real edition text, dates, save counts, and the shared source metadata take precedence over generated sample content. Keep the established 11px type floor, 44px controls, and neutral metadata; do not copy the mock's fabricated result count or duplicate Copy link action. The reading desk remains a separate opt-in prototype.

The complete result row is the question link's pointer target, including the number, date, source/save metadata, and padding. Keep one semantic title link as its keyboard entry and use a yellow outline around the complete row when that link receives keyboard focus. The personal bookmark sits above the link hit area and remains independently operable. The user authorized pushing the prototype and annotation fixes to `main` on 1 October 2026; the default main Archive retains its existing entry until promotion is requested.
