# Design QA: Annotated editorial refinement

## Findings

- No actionable P0, P1, or P2 findings remain.
- P3: Cloudflare Turnstile can show a domain-verification warning in the local preview. The production-bound anti-spam integration and form behavior were not changed by this visual pass.

## Evidence

- Source visual truth: the eight annotated browser screenshots attached to the current request, captured from the home and archive routes at 1262 × 998 CSS pixels.
- Implemented view: browser-rendered captures from `http://127.0.0.1:4173/#` and `#/archive`. The in-app browser did not expose screenshot filesystem paths.
- Matched desktop comparison: 1262 × 998 CSS pixels at browser density 1.
- Responsive validation: 390 × 844 CSS pixels at browser density 1.
- Compared states: home opening spread, first expanded Signals & Sources table, Question trail action, archive category result, and mobile home/intake/question layout.
- Full-view evidence: the annotated opening-spread screenshots and the revised 1262 × 998 home capture were compared for navigation density, H1 leading, article-intake hierarchy, form order, and major-region proportions.
- Focused-region evidence: the annotated signal-table and second-question screenshots were compared with the revised expanded detail capture for coral emphasis, Question trail anatomy, and question-title leading.

## Fidelity surfaces

### Fonts and typography

- Neue Reckless remains the editorial display family and Inter remains the interface family.
- The daily H1 now uses 1.02 leading and multiline question titles use 1.03 leading, resolving the compressed line rhythm identified in the annotations.
- `Article intake` uses normal title capitalization. The intake H2 is an editorial heading rather than a compact interface label.

### Spacing and layout

- The primary navigation now contains only `Archive`; category links remain available inside the archive filters where they are contextually useful.
- Article-intake content follows a vertical reading order: label, H2, explanatory copy, then URL form.
- The intake form spans the available right-column width and preserves the opening spread's strict two-column alignment.
- Desktop and mobile views have no horizontal overflow.

### Colors, imagery, and icons

- Strong phrases in signal-table analysis use the shared coral token, matching the requested editorial emphasis.
- Sage remains reserved for links and interactive affordances; yellow remains the focus and `Must read` signal color.
- No new imagery or approximate assets were introduced. Existing Phosphor navigation and bookmark icons remain consistent.

### Copy and content

- The intake heading is now `Contribute to the next crawl`, which explains the outcome before asking for a URL.
- The empty `Further reads` label was replaced by the clearer `Question trail` feature.
- Its action reads `Explore similar questions`, with category context in `More from {category} in the archive`.

## Interaction and accessibility checks

- The Question trail for the first Process question opens `#/archive?category=Process`, selects Process, and returns 13 matching questions.
- Archive remains a semantic header link and the only primary-navigation item.
- Article input, submit state, question disclosures, bookmarks, source links, search, and archive filters remain semantic and keyboard accessible.
- The fresh post-fix browser tab returned no console warnings or errors.
- Mobile controls retain practical tap targets and the new vertical intake order remains readable at 390 pixels.

## Comparison history

- Source annotations identified excessive header choices, compressed H1 and question leading, lowercase intake labeling, a horizontally fragmented intake, low-contrast analytical emphasis, and an empty Further reads region.
- Fix: removed header category links; increased headline leading; rebuilt the intake as a vertical editorial block; moved explanatory copy above the URL form; changed emphasis to coral; and added the working Question trail.
- First implementation QA exposed duplicate React keys when a question included two signals from the same publisher. This was a P2 implementation-quality issue because rows could become unstable.
- Fix: signal-row keys now include their array position. A fresh browser session returned no React errors.
- Post-fix evidence: the matched 1262 × 998 capture preserves the original editorial grid while implementing every annotated change, and the 390 × 844 capture has no horizontal overflow.

## Verification

- `npm run build`: passed and emitted the required Sites artifacts.
- `npm test`: 17 of 17 tests passed.
- `npm run test:sites`: 4 of 4 tests passed.
- `git diff --check`: passed.

final result: passed
