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
The Today prototype opening pairs the title and crawl perspective horizontally on desktop. Article intake begins one full square row below, leaving an open band of modules, and spans three desktop square columns with a content-measured height and a two-row desktop minimum. The questions overview and intake grow and shrink in whole square rows according to their measured content plus padding. The opening adds and removes whole rows with these panels while preserving the empty band above intake. Question spreads use a prominent coral Reckless number and filtered prototype Archive category links beneath the editorial title. Expanded source details align to whole grid rows and occupy six modules in columns 2 through 7 on desktop and tablet, sharing the reading panels’ right edge; the Question archive occupies the rightmost three. Source disclosure is a full-width secondary sage `Open sources` / `Close sources` text row below the source list, with transparent fill, a complete sage outline, and its icon at the right edge.
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

- Daily questions use `Bookmark for me` in the question-and-answer panel overline, right-aligned opposite `The question` (`Bookmarked for me` when saved). Keep `Open sources` / `Close sources` below the source list as a full-width secondary sage outlined button with its icon on the right. Keep both controls at least 44px high and make bookmark clicks independent of the source disclosure. The question-and-answer panel is a passive reading surface: text and padding never toggle sources, and the panel has no pointer cursor or clickable hover surface. Source toggling remains on the explicit title and source disclosure buttons.
- Toolbox rows use `Bookmark tool`.
- Save state is personal and must not be visually confused with editorial ranking.

Interactive editorial reading rows use the shared `--surface-hover` token to light up their complete hit area on hover and keyboard focus. Keep the treatment flat and square, without adding an underline on hover. Today's overview question links cover the complete row, including its number, category and padding; focus outlines the row in yellow. Source rows, source disclosures, Question archive links and bookmark controls reuse the same surface. Preserve native link behavior and established resting affordances. The question-and-answer reading panel remains passive.

## Editorial structures

### Today

Lead with a text-first edition overview and article intake. Questions are compact numbered rows with a visible answer, provenance, and an optional `Signals & Sources` disclosure.

In the seven-module Today field, each numbered editorial title starts in the left four modules and expands by whole columns up to the full seven-module field before adding rows. Its question, personal bookmark and answer sit immediately below in columns 2 through 4, leaving the first square column open beneath the question number and aligning the reading panel beneath the title text. The right three modules stack Editorial context above Sources, starting below the title’s measured row span alongside the question-and-answer panel. Top-align the two panels with identical eyebrow centers. Give the question-and-answer panel its own smallest fitting whole-module height; leave unused squares beneath it open rather than stretching it to the right stack. Keep title-row modules beyond the measured title width open. Expanded signal details span columns 2 through 7, six modules wide, sharing both reading stacks’ outer edges and starting beneath the longer stack. On mobile, preserve the full-width reading order of title, question and answer, context, then sources.

The Today panel eyebrows (`The question`, `Editorial context`, and `Sources`) use coral. Bookmark controls and the source disclosure use sage. The disclosure is a 48px-high transparent secondary button with 14px horizontal padding, a complete sage outline, a semibold label and a bold trailing chevron. Reuse the shared full-row hover surface and yellow keyboard focus outline; do not add hover underlines.

As of 6 October 2026, `What I came across` is suspended from the current product interface. Remove its navigation, mounted route, manifest link and service-worker registration from the main entry. Preserve its implementation and private data for a separate conversation.

### Archive

Lead with a short `Start here` area for foundational reading, then a dense `Question index`. Retrieval includes search, the four categories, Must read, skill label, and date.

### Toolbox

Lead with the weekly point of view and tool intake. Follow with three current signals, then the persistent collection with search, type, practice, verdict, Worth trying, and Best practice retrieval.

The opening Tool intake sits two square rows below its previous position and spans the rightmost three modules above 720px. Desktop starts it in row three; tablet moves it two rows below its previous position after the orientation panel. Its measured content determines the smallest fitting whole-module height, and the opening extends to contain it before the weekly section. Mobile retains the full-width stacked intake and shared 48px contribution controls.

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
Above 720px, expanded Today source tables span six modules in columns 2 through 7 on desktop and tablet, aligned to the question panel on the left and the source rail on the right. Preserve the right-aligned three-module Question archive. Mobile details remain full-width.

### Local Archive reading-desk experiment

The selected second exploration direction is available at `grid-prototype.html?reading=desk#/archive`. It reuses the shared Grid header, footer, tokens, archive editions, AI badge, highlighted text, and personal bookmarks. It does not replace the main Archive entry point.

Above 1200px the seven-module field becomes a three-module index alongside a four-module reading pane. The index grows with its results and scrolls with the page; the selected row has a sage rail and a subtle full-row surface. The reader has a fixed action strip, the full question, answer, permanently visible source links, expanded signal notes, a Question archive, and navigation through current results. The reader stays sticky below the shared header, has its own viewport-height scrolling area, and remains visible while the list continues. The complete last 30 calendar days are initially visible; older questions are revealed in batches of 20 when the end approaches, with a keyboard-accessible load action as fallback. Explicit search and date filters retrieve the whole matching history immediately. The footer follows the complete loaded list. This layout deliberately departs from square-row content sizing for this local exploration.

At 721px through 1200px, selecting a question switches to a full-width reader with a readable measure. At 720px and below, the reader stacks naturally, secondary skill labels are hidden, and categories in the results remain horizontally scrollable. The action strip stays below the shared sticky header. `Back to results`, Escape, and browser Back restore the results context and selected link focus. Questions and filters are encoded in the URL; changing questions within the reader replaces its history entry so browser Back returns to the index.

The mock establishes the layout and anatomy. Real edition text, dates, save counts, and the shared source metadata take precedence over generated sample content. Keep the established 11px type floor, 44px controls, and neutral metadata; do not copy the mock's fabricated result count or duplicate Copy link action. The reading desk remains a separate opt-in prototype.

The complete result row is the question link's pointer target, including the number, date, source/save metadata, and padding. Keep one semantic title link as its keyboard entry and use a yellow outline around the complete row when that link receives keyboard focus. The personal bookmark sits above the link hit area and remains independently operable. The user authorized pushing the prototype and annotation fixes to `main` on 1 October 2026; the default main Archive retains its existing entry until promotion is requested.

### Combined Archive review

`grid-prototype.html?reading=combined#/archive` combines the live Archive opening with the reading desk. The upper opening, question count and four Start here paths reuse `ArchiveEditorialOpening` without changing their content, typography, geometry, or intrinsic square-row sizing. Preserve the empty module before the new Question index. Only the lower retrieval controls and results are replaced by the compact three-module index and four-module reader.

The subsequent annotation review removes the empty module between the opening and Start here, moving all following Archive content up one square row. Keep the blank module before the Question index. In Archive and Toolbox, constrain orientation paragraphs to the panel's available content width with a 35ch maximum, so text wraps inside its own surface instead of extending into the count or contribution panel.

Start here links clear previous retrieval filters, select the corresponding category, and reveal the index beneath the shared header. Direct question links open the reader at the index. At tablet and mobile widths, the opening and results disappear while reading; Back to results restores the complete combined archive and its previous results position and keyboard focus. Keep both existing review modes and the current main Archive available. This combined composition is a local review prototype pending the user's later publishing decision.

The user approved publication after the annotation fixes on 1 October 2026. The regular `#/archive` route now uses the combined composition, and `#/questions/...` opens the same reader with the existing shareable identifiers. Privacy retains its dedicated route. The opt-in standalone and combined review URLs remain available.

### Mobile revision · 2 October 2026

The mobile field uses eight smaller squares across the viewport. Seven squares carry content; half squares frame the sides and the top/bottom. Panels retain the shared 0.75px inset and their intrinsic heights snap to whole rows, including expanded content. The footer shares the same module width and draws its own rules.

Use a fluid mobile type scale: 32–48px opening titles, 18–23px questions, 17–20px reading copy, and an 11px metadata floor. Static text is paper on forest, ink on white, or coral emphasis. Sage belongs to interactive states, not static reading copy.

Mobile Archive presents eight questions per page, explicit Previous/Next actions, full-history search, and a direct Find a question jump from the opening. One question expands inline with its answer and source provenance. Extended signal notes open separately. Shareable question URLs, independent bookmarks, list context, and keyboard focus survive opening and closing. The desktop and tablet reader remain unchanged. This revision is under local review.

On mobile, Today's Article intake follows all four complete question sections, before the shared footer. Its DOM order follows the same reading and keyboard sequence; desktop and tablet retain the opening placement. Mobile Archive column layouts preserve both row inset margins without collapsing them, keeping the results, pagination, and footer aligned to the shared square field.

The user approved publication of this reviewed mobile revision, including the footer alignment and intake placement fixes, on 2 October 2026. It applies to the regular routes and the shared prototype entry.

The user approved publishing these reviewed Today layout and shared control changes to main on 6 October 2026. Private inspiration studies remain separate from this release.

Question bookmark controls use the concise labels `Bookmark` and `Bookmarked` (6 October 2026). The user rejected the broad source-disclosure concepts and requested a narrow opening/closing iteration that preserves Today’s existing composition. Keep the panels, permanently visible source links, signal table, and archive referral. The existing secondary disclosure now reads `Read source notes` / `Close source notes`, with no duplicate source count, a reversed chevron and the shared hover surface while open. Source notes fade in over 160ms without animating the square grid geometry; reduced motion disables the fade. A closing control at the end of the notes and Escape return focus to the originating disclosure. This local iteration supersedes the earlier disclosure-label guidance.


Today reading refinement (6 October 2026): body copy and source titles use Inter; headings H1/H2/H3 and expressive numerals remain Neue Reckless. The user reverted only the all-white text-color change: retain the preceding neutral reading colors and coral panel eyebrows, editorial numerals, emphasized insights, verdicts, and footer claims. Keep sage controls and reading links and ink on the shared yellow AI badge. Preserve the Reading trail layout, Inter typography, and accordion behavior; other routes retain their existing treatments.

Replace Today’s legacy archive teaser with a right-aligned, three-module Reading trail. `Follow this thread` introduces up to two existing earlier questions connected by topic words, shared skills and category, with their category and archive references and full-row links to the shared reader. Exclude the current question and duplicate titles. End with `Continue in the [category] archive`, which also serves as the fallback when no related question is available. Keep the section open and flat with subtle separators; stack it naturally on mobile. Preserve the current Today panel arrangement and source disclosure behavior.


Today context and source alignment (6 October 2026): Editorial context and First seen now sit inside the left reading panel beneath the Why it matters answer. The separate Sources panel remains in columns 5–7 and shares the left panel’s bottom module boundary; its measured source-list height grows upward from that boundary. Preserve open modules above it and place expanded notes below both panels. Mobile follows the same semantic sequence in stacked flow. Coral answer and signal-note highlights use italics. The Reading trail introduction reads `Another perspective can change the question. Find more context in the archive.`

The ending `Close source notes` action sits near the expanded panel’s bottom edge with a small 12px inset and its complete 48px target inside the panel. Center it horizontally beneath the Reading trail’s content width. Reserve the action’s 48px height, 12px bottom inset, and 16px separation beneath the Reading trail in the content measurement. Square-row rounding leaves spare space above this action, and the panel remains able to grow and shrink after resizing. Keep this placement on mobile as well.

The ending close action reuses SecondaryButton with the same sage outline, padding, typography, 48px height, open-state surface, and trailing chevron as the source-list disclosure. Match the right-hand source column’s content width; use the available content width on mobile.


### Guidance icons · 6 October 2026

Use the free original Guidance vectors by Streamline through `src/icons/index.jsx` for arrows, disclosure, search, clock, plus/minus, image, information, favourites, play and close. Phosphor remains for twelve roles without a direct Guidance equivalent, including bookmarks and the AI robot. Preserve geometry, existing sizes, semantic labels, control targets and shared colours. Thin strokes support large action cursors. Keep CC BY 4.0 attribution visible on Privacy and preserve original vectors and pinned provenance in `public/icons/guidance/`. No paid assets, external icon service or account connection is introduced.


### Global Tangity point · 6 October 2026

Use one shared coral dot across every Design Daily route and the standalone prototype entry. The fine mouse pointer is 10px at rest and 24px over links and buttons, with immediate tracking and a 120ms size transition. Editable fields, disabled controls, drag and image inspection keep native or contextual cursors. Keyboard, touch, blur and route transitions hide the point; reduced motion removes its size animation. The cursor is noninteractive and hidden from assistive technology. No routing, capture or access changes are part of this release.


Simple Close icon (6 October 2026): all Close actions use the same shared X made from two diagonal strokes. This replaces Guidance’s outlined cross everywhere, including reader controls, weekly archive, the small image-heading button and large hover cursor. Preserve each control’s size, ink, label and behaviour.


### Inspiration canvas published · 6 October 2026

The user authorised publishing What I came across to main. Use V2 Image bands by default, retain week pagination and earlier layouts, and expose the inspiration tab across the shared navigation with Privacy at the right. Keep personal records in private per-browser IndexedDB and never ship owner captures. Public capture/import/export and crawler-to-personal saving work without credentials; enrichment and provider sync remain local-service capabilities. Header, point cursor and simple line Close icons use the existing shared system.

### Today headline revision

The approved opening revision gives the edition headline three square columns, the crawl perspective two, and the question overview two above 1200px. At tablet widths, retain the three-column headline, move the perspective below it across the left four modules, and give the question overview the right three modules. Generate headlines of 8 to 11 purposeful words with one meaningful coral italic phrase; use HighlightedText to render double-asterisk emphasis in both the edition headline and question titles. Keep comfortable display leading, intrinsic whole-module heights, the open row above intake, and the existing full-width mobile stack. The user approved publication to main on 6 October 2026.


### Public discovery journal and shared mobile navigation · 7 October 2026

The user corrected the inspiration product model: the live site documents Rapha’s discoveries publicly, with the same weekly Image bands for every visitor. Only explicitly approved references enter public/data/inspiration.json through an allowlisted exporter; the initial publication contains the six new Savee references approved for Week 41, four images and two videos. Private capture records, notes, projects, credentials and raw account exports stay local. Original Savee save dates are unavailable, so the publication uses the user-confirmed week rather than inventing historical dates. Public visitors can browse, search, open media and follow sources, with no editing or account controls. Loopback remains the private owner workspace.

Use exactly the same desktop tab geometry on every route; remove Inspiration-specific column spans. At 720px and below, keep Today and Archive visible alongside an ellipsis button. It opens a simple, full-width list for Toolbox, What I came across and Privacy. Preserve the active destination in that list and an active More indicator. Support keyboard opening, Escape, outside dismissal and route changes; use 48px or larger targets. ScreensDesign research: https://screensdesign.com/apps/the-globe-and-mail/?vs=314389 and https://screensdesign.com/apps/buzzfeed-quiz-trivia-news/?vs=87666.

## Toolbox email

- The Toolbox change log uses the white Toolbox visual language: coral `design / daily` masthead, `by ra.re design`, editorial Neue Reckless headings, Inter body, thin neutral rules and square source/action links. Italic email entry numbers use the shared coral token. New entries precede before/after changes. Keep original evidence, access/setup, verdicts and source failures visible.
- Render HTML with presentation tables and inline styles, using literal values resolved from `public/tokens.css`. Self-hosted brand fonts are optional; use generic serif/sans-serif fallbacks when an email client blocks webfonts. Never require images, scripts, CSS Grid or remote fonts to read the message. Maintain a text rendering for inspection and the existing once-per-Berlin-day delivery guard. Preview generation must not send email.

### Inspiration grid alignment · 7 October 2026

The reviewed weekly page adopts Toolbox’s seven-module body width, half-module side gutters, visible shared square raster, neutral rule tone, 0.75px inset content panels and light SiteFooter. Weekly surfaces use useSquareLayouts to fit whole module rows. Title/date occupies columns 1–3, column 4 remains open, navigation occupies 5–6 and search occupies 7; mobile stacks the title above separate navigation and search cells. Center the image bands on both axes. Preserve the published feed and existing week navigation, search and image details. The user approved publication to main on 7 October 2026.
