# Design QA: navigation and archive refinement

## Findings

- No actionable P0, P1, P2, or P3 findings remain.
- The first comparison exposed a typography leak: the shared `AI lens` pill inherited the oversized issue-number style in archive rows. Number spans now have explicit classes, so the pill keeps the same compact Inter treatment on daily, archive, and detail views.

## Evidence

- Source visual truth: the nine annotated production screenshots supplied with this request from `https://r4ph426.github.io/design-daily/`, captured at 1262 × 998 CSS pixels. The in-app browser does not expose screenshot filesystem paths.
- Implemented view: browser-rendered checks at `http://127.0.0.1:4173/#` and `http://127.0.0.1:4173/#/archive`, captured at the matched 1262 × 998 CSS-pixel viewport. The in-app browser does not expose screenshot filesystem paths.
- Responsive validation: both routes checked at 390 × 844 CSS pixels, then the temporary viewport override was reset.
- Reference patterns: Financial Times Edit's current-edition/editions split and Apple News Today navigation supported two short top-level destinations. Google navigation guidance supported concise labels, a small number of top-level tabs, and a persistent selected state.

## Fidelity surfaces

### Navigation

- The header now contains exactly two equal-status destinations: `Today` and `Archive`.
- The current destination uses `aria-current="page"`, a persistent underline, and a restrained green hover/selected surface.
- Header search was removed. Search remains inside Archive, where its scope is clear.
- Desktop and mobile states have no horizontal page overflow. On mobile, both navigation targets are 48 pixels high and split the row evenly.

### Archive retrieval

- Removed the competing `All questions`, `Popular`, and `My bookmarks` view tabs.
- The single category row now contains `All`, UI, UX, Process, Culture, and `Must read`.
- `Must read` is editorially derived from source verdicts and remains separate from all-time saves and `Popular recently`.
- Browser interaction verified that `Must read` selects correctly and reduces the current result set from 32 to 21 questions.
- Search guidance now sits immediately below the archive search input.
- Archive IDs use edition/question references such as `008/01`; the browser showed the expected sequence and detail views reuse the same identifier.

### Labels and typography

- `AI lens` is rendered through one shared component: a 25-pixel-high yellow pill with a robot icon, black text, and 11-pixel Inter type.
- Critical phrases in signal analysis are coral, Neue Reckless, and italic.
- Source links and `Question trail` links both resolve to `padding-left: 0px` for grid alignment.
- Existing open headline leading is preserved: the daily H1 resolves to 1.02 leading and mobile question titles to approximately 1.03.

## Interaction and accessibility checks

- Today and Archive expose correct active-page semantics on their respective routes.
- Archive search, filters, selects, bookmark controls, source links, and question destinations remain semantic and keyboard accessible.
- Mobile category filters remain horizontally scrollable; every category button is 44 pixels high.
- The local preview console returned no warnings or errors after the final fix.

## Verification

- `npm run build`: passed and emitted the required Sites artifacts.
- `npm test`: 17 of 17 tests passed.
- `npm run test:sites`: 4 of 4 tests passed.
- Browser QA: desktop and mobile passed with no horizontal overflow.

final result: passed
