# Archive reading desk QA

final result: passed

## Publication approval

The user approved pushing the reviewed combined Archive to main. The regular `#/archive` entry now renders the shared opening and reading desk, and `#/questions/...` stays in the Grid layout and opens that reader. Existing identifiers and both opt-in review modes remain available.

- Regular-route desktop capture: `artifacts/archive-flow/published-archive-reader.jpg`, 1280 × 988, UX filtered, question 015/02. Start here category links open the correct index and selecting a result uses the regular shareable question URL; the reader starts at 115.75px.
- A fresh regular question URL loaded at 390 × 844 with the opening hidden, reader top at 107.75px and no document horizontal overflow (`published-archive-mobile.jpg`). Back to results restored the combined Archive with the UX URL filter. Privacy navigation still opens the dedicated Privacy surface.
- The reader now synchronizes its breakpoint state when attaching the media-query listener, covering viewport changes during initial loading.
- Production build, all 26 tests and Sites packaging checks are verified before the publishing commit. The prior main state is tagged so the Archive promotion can be reverted as one commit.

## Latest opening annotations

All three browser comments are addressed in the shared Archive/Toolbox styles. This supersedes the earlier preserved opening-to-Start here separation; the separate blank module before Question index remains.

- Removed the Archive Start here top margin. At 1280px, the opening-to-Start here gap changes from 160px to 0px and the combined index starts at 1555px instead of 1715px. The four path cards and all following content move up exactly one square row.
- The intrinsic-height measurement's `flex-shrink: 0` made orientation copy 402.75px wide inside a 318.5px panel. Explicit `width: 100%` now bounds both Archive and Toolbox paragraphs to the available content width, while keeping the existing 35ch maximum. At 1280px they measure 276.27px, including neither padding nor neighboring panels, and wrap naturally.
- Desktop evidence: `artifacts/archive-flow/opening-annotations-before.jpg`, `opening-annotations-archive-fixed.jpg`, and `opening-annotations-toolbox-fixed.jpg`. Visually inspected both corrected openings: no text paints into the question-count or contribution panels; shared header, raster strokes and typography remain consistent.
- At 834px tablet and 390px mobile, both paragraphs stay completely within their panel bounds and the document has no horizontal overflow. The Archive separation remains 0px. Responsive captures: `opening-annotations-archive-834.jpg`, `opening-annotations-toolbox-834.jpg`, `opening-annotations-archive-390.jpg`, and `opening-annotations-toolbox-390.jpg`; tablet Archive and mobile Toolbox were visually inspected.
- Production build and whitespace checks passed. No additional tests were added for these two reversible CSS changes. The combined local Archive remains available for review; no publication was performed.

## Latest combined Archive review, 1 October 2026

The user requested the current live opening from screenshot 1 followed by the approved reading desk replacing the old Question index from screenshot 2. Local review URL: `http://localhost:5181/grid-prototype.html?reading=combined#/archive`. The main Archive still uses its original lower index; this turn does not publish the combined composition.

- Both supplied screenshots were inspected. The upper source is the existing live-route markup, now shared through `ArchiveEditorialOpening`. At 1280 × 988 CSS pixels, the original and combined opening both measure 480px; Start here measures 800px and ends at 1555px; the index starts at 1715px after the preserved 160px blank module.
- Matched full-page captures: `artifacts/archive-flow/combined-before-full.jpg` (main Archive before extraction) and `combined-after-full.jpg` (combined prototype). Their upper 1280 × 1555 regions were placed together in `combined-opening-comparison.jpg` and visually inspected. Only an 8 × 8 arrow antialiasing region differs; all upper layout, copy, typography and raster geometry are preserved.
- Reader anatomy remains the selected Option 2 direction recorded below. Final desktop evidence: `combined-desktop-final.jpg`, 1280 × 988, All filter, question 015/01, reader at top. The compact index and full reader use the same typography, token colors, provenance and controls as the approved standalone desk. The integration deliberately preserves the live editorial opening above them.
- Start here Process, UX and Culture paths selected their category and revealed the index beneath the header. A fresh direct question load focused its reader heading with index top 115.5px. A full-row coordinate click at (100, 760) switched from 015/01 to 015/02. Browser Back returned to results and restored the originating question-link focus. Search, categories, skill/date controls and URL state reuse the existing reading-desk implementation.
- Tablet 834 × 1112: `combined-tablet-reader.jpg` and `combined-tablet-results.jpg`. Selecting a question hides the opening and index while the reader fills the field. Return restores the upper Archive and the original result link; no document horizontal overflow.
- Mobile 390 × 844: `combined-mobile-reader.jpg` and `combined-mobile-results.jpg`. Reader begins at 107.75px beneath the shared header with no extra gap or horizontal document overflow. Back restored the Culture results and the originating link at 330px in the viewport. Category filters retain their horizontal scrolling and 44px controls.
- Additional 768 × 1024 tablet and 320 × 740 mobile checks passed: reader and results use the intended single-view layout without horizontal document overflow. Temporary viewport overrides were reset before opening the review for the user.
- A P1 found during verification was corrected: a fresh shared question could retain an unrelated document scroll position. Initial filtered and question URLs now jump after fonts and square-row measurements settle. Returning from tablet/mobile similarly waits for the opening's layout to settle before restoring the saved position.
- Production build passed; all 26 tests passed; Sites packaging checks passed 4/4. Browser console had no errors or warnings. No remaining actionable P0/P1/P2 findings.

## Latest annotation fix: entire result row is a link

The user's second browser annotation requires the complete question row to switch questions. A stretched native title link now covers the row's number, metadata and padding; the separate bookmark is layered above it. No visual geometry changed. Keyboard focus outlines the entire row in the existing yellow token.

- Native coordinate clicks at (90, 620) and (90, 850) in a 1280 × 988 CSS viewport switched to 015/01 and 015/02 respectively, outside the title/arrow targets.
- Bookmark 015/01 toggled while question 015/02 remained selected; the test save was reverted.
- Enter on the semantic question link selected 015/01 and focused its reader heading. Shift+Tab from its bookmark focused the link and produced a 2px yellow full-row outline (`desk-full-row-keyboard.jpg`).
- At 390 × 844, a native click in the left bottom padding of the first row opened the mobile reader with no horizontal overflow.
- Final annotated-question capture: `artifacts/archive-flow/desk-full-row-final.jpg`, question 015/02. Browser console contained no errors. This interaction-only change preserves the visual source and earlier comparison results.
- Build and all 26 tests passed; Sites checks passed 4/4. The user authorized pushing the prototype and fixes to main. The opt-in prototype scope remains intact.

## Latest revision: natural-height index, 1 October 2026

User browser Comment 1 overrides the initial fixed-height index: the Archive region must grow with its question list, initially covering at least the last 30 days. The original Option 2 image remains the visual reference for the reader anatomy.

- Latest matched-state capture: `artifacts/archive-flow/desk-long-list-filtered.jpg`, 1425 × 1013 pixels at a requested 1440 × 1024 CSS viewport, question 014/01 with verification + Process filters. Combined with the normalized original reference in `desk-long-list-comparison.png` and visually inspected. Reader typography, controls, proportions, tokens, and provenance remain consistent. New focused crops were unnecessary because the change concerns overall region height and scrolling; the earlier reader-anatomy comparison remains applicable.
- Unfiltered desktop evidence: `desk-long-list-scroll.jpg`, 1280 × 988 CSS viewport, question 014/04 selected midway through the list. The Archive region measures 12,707px, containing all 60 real questions from the current last-30-day window. Results use document scrolling; the reader stays at 115.75px under the header with its own 871.5px scrolling area. Footer follows the complete list.
- P1 found at the final question: the sticky reader was constrained upward by the region end, clipping its heading after selection. Opening a question now limits the page scroll only as far as needed to fit the reader. Fixed evidence: `desk-long-list-end-final.jpg`; last question 001/04 shows its title at 279.25px, reader top at 115.75px, and Archive bottom at 988px. `desk-long-list-end.jpg` preserves the pre-fix evidence. Closing restores the originating results position.
- Tablet at 834px and mobile at 390px keep natural reader heights and the existing single-view behavior. Back restored the original question link visibly in the viewport at 548.88px and 356.39px respectively; mobile has no horizontal document overflow.
- Older questions reveal in batches of 20 as the list end approaches, with a keyboard-accessible button fallback. Search/date filters retrieve all matching history, and older shared questions extend the visible index. All available real editions currently fit inside 30 days, so no real older batch exists yet; window boundaries, batch limits, historical retrieval and older selection are covered by four fixture-based tests. This prototype progressively renders the already fetched archive data; it does not add a paginated network API.
- Fresh browser console check: no error logs. Build passed; `npm test` passed 26/26 and `npm run test:sites` passed 4/4.

This latest revision supersedes the independent-results-scroll description in the initial verification below. No actionable P0/P1/P2 findings remain.

## Visual source and implementation

- Source visual truth: `artifacts/archive-flow/concept-2-reading-desk.png`, the second displayed exploration option selected by the user.
- Source pixels: 1487 × 1058, unframed generated desktop reference.
- Implementation: `http://localhost:5181/grid-prototype.html?reading=desk#/questions/2026-09-30/if-ai-is-doing-the-first-pass-what-evidence-do-designers-now-owe?q=verification&category=Process`.
- Final capture: `artifacts/archive-flow/desk-desktop-final.jpg`, 1425 × 1013 capture pixels, browser viewport requested at 1440 × 1024 CSS pixels, default device density. The browser capture omits its scrollbar edge. The reference was resized to the exact capture dimensions for comparison; no browser chrome or device frame is included.
- State: dark forest, Archive active, query `verification`, Process selected, question 014/01 open, reader at top, no bookmark or copy-success state.
- Full-view comparison: `artifacts/archive-flow/desk-desktop-final-comparison.png`, both images in one comparison input.
- Focused comparison: `artifacts/archive-flow/desk-reading-region-comparison.png`, matching reader crops placed together.

## Comparison history

1. `desk-desktop-v1-comparison.png`: P1 opening a question scrolled the page past the reader title and index controls; P2 numeral styles leaked into the shared AI badge. Fixed by resetting the page and reader scroll on selection and excluding the AI badge from numeral styling.
2. `desk-desktop-v2.jpg`: P2 index controls could scroll out of view. Fixed by keeping index heading and filters outside a separately scrollable results area. Programmatic heading focus no longer draws a decorative focus box around noninteractive copy; keyboard controls keep their yellow rings.
3. First combined final comparison: P2 index heading and filters consumed excess vertical space relative to the chosen compact direction. Removed the extra introductory line and tightened desktop heading, filter gaps, and result typography. Retained 44px controls.
4. Revised `desk-desktop-final-comparison.png` and focused comparison inspected together: fixed index controls, compact results, full reader heading, shared AI anatomy, hairlines, editorial typography, neutral metadata and clearly identifiable interactive controls. No actionable P0/P1/P2 findings remain.

## Intentional differences

- Reuse the existing shared header and footer rather than the generated mock's altered header descriptor placement.
- Real edition content produces two matching results rather than the mock's fabricated three; long titles remain accessible in full and are clamped only in the desktop index.
- Real source notes, provenance, dates and save counts replace abbreviated/generated content. Emphasis comes from actual double-asterisk markup rather than invented editorial emphasis.
- No redundant visible result-count row or duplicate Copy link action. Existing design rules require Clear filters inside retrieval controls and recent popularity separate from team saves.
- Fixed three/four-module panes follow the selected flow. Natural reading height and 44px controls intentionally take precedence over square-row height snapping inside this local experiment.
- Tablet/mobile adaptations are new responsive interpretations of the selected desktop reference, not fidelity comparisons against nonexistent device mocks.

## Responsive and interaction verification

- Desktop: 1440 × 1024; three/four-module split, independently scrolling results and reader, selected row, fixed search/filter area, shared header and footer.
- Breakpoint: 1201px keeps both panes; 1200px shows one full-width view. Selection survives resizing and reading returns to the top at the layout transition.
- Tablet: 834 × 1194 (`desk-tablet-final.jpg`) and 768 × 1024; full-width reader, readable measure and sticky action strip.
- Mobile: 390 × 844 (`desk-mobile-final.jpg`, `desk-mobile-index.jpg`) and 320 × 740; no document horizontal overflow, horizontally scrollable category filters, natural stacked content, 44px interactive targets in index and reader.
- Open from a scrolled mobile list and return: restored page scroll to 1463.5px and focused the original question link, visibly in the viewport.
- Browser Back returned from reader to `archive?q=verification&category=Process` with the search intact. Close/Back to results and Escape restore results. Reader question changes replace the current history entry.
- Search, category, Must read, skill and date filters verified together; Ethics + September + Must read + verification returned one result. Empty query result and Clear filters verified.
- Reader bookmark toggles updated the index bookmark and shared local storage; reverted the test bookmark afterwards.
- Copy link showed its success label; direct question URLs loaded with the filter context and real edition data. Source links and Question trail use real targets.
- Today, Archive and Toolbox retain their 115px shared desktop header geometry and correct active navigation.
- Console: fresh final tab after reload and responsive captures contained no error logs. A temporary hot-reload ReferenceError during implementation was corrected before the final verification.
- Build passed. `npm test`: 22/22 passed. `npm run test:sites`: 4/4 passed; required Sites outputs present.

## Residual scope

Local prototype only. No publication or live main-Archive replacement. The source copy action was exercised through its success state; no external article was submitted. Responsive behavior was checked in browser viewports, not on physical touch devices.
