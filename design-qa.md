# Archive reading desk QA

final result: passed

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
