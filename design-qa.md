# Design QA: Hybrid question archive

## Findings

- No actionable P0, P1, or P2 findings remain.
- P3: team-save metrics use deterministic prototype values when an edition does not yet provide a `question.popularity` payload. The UI already prefers supplied all-time and trailing-30-day values, so the data pipeline can replace the fallback without changing the archive layout.

## Evidence

- Selected source visual: `/Users/raphael.regli/.codex/visualizations/2026/09/22/01a0c927-3526-7ac0-8f01-65419c571ca1/question-archive-first-look.html`, hybrid state with compact editorial paths and team signals enabled.
- Implemented view: browser-rendered captures from `http://127.0.0.1:4173/#/archive` and a stable `#/questions/{date}/{slug}` detail route. The browser tool did not expose screenshot filesystem paths.
- Comparison viewports: 1440 × 1000 desktop, 1024 × 900 tablet, and 390 × 844 mobile CSS pixels at browser density 1.
- Compared states: default archive, category filter, controlled skill filter, all-time popularity sort, personal bookmarks with reload persistence, text search, empty/filter reset behavior, and archived-question detail.
- Full-view evidence: the default desktop archive was compared with the previously selected first-look visualization for section order, editorial/index balance, density, typography, token use, and hairline grid rhythm.
- Focused-region evidence: the mobile index controls and mobile question detail were inspected separately; the desktop dense rows and detail hierarchy were also inspected at the 14% / 48% / 38% grid.

## Fidelity surfaces

### Fonts and hierarchy

- Neue Reckless is used for the H1, H2, H3 question titles, expressive numerals, answers, and source titles; Inter remains the interface, metadata, filter, and supporting-copy family.
- The archive has one H1, `Start here` and `Question index` as H2 sections, and path/question titles as H3 elements. No artificial H4 layer was introduced.
- Long question strings wrap without clipping at desktop, tablet, and mobile sizes.

### Spacing and layout

- The hybrid order is preserved: compact editorial starting points first, followed by the denser retrieval index.
- Major sections and question rows use exposed hairline rules rather than rounded cards, shadows, gradients, or decorative background grids.
- Desktop question rows retain the 14% / 48% / 38% composition. Tablet paths collapse to two columns, and mobile rows preserve a compact number rail with stacked content and metadata.
- Horizontal-overflow checks passed at 1440, 1024, and 390 pixel viewports.

### Colors, imagery, and icons

- The implementation uses the shared forest, coral, yellow, sage, paper, and black tokens; no new hardcoded color literals were introduced.
- Coral remains editorial, sage marks interactions, and yellow remains the focus treatment.
- No imagery was required by the selected text-led archive direction. Phosphor icons supply consistent search, bookmark, navigation, and external-link affordances.

### Copy and content

- `Start here` explicitly states that its four paths are editorially selected and never determined by save count.
- Overall popularity exposes all-time team-save counts. `Popular recently` is a separate label and appears only at three or more distinct saves in the trailing 30 days.
- Skill labels use a controlled vocabulary and the UI explains that they describe the practice needed to engage with a question.
- Each question destination exposes its answer, sources, edition, related questions, popularity context, and personal bookmark control.

## Interaction and accessibility checks

- Search, category, skill, date, all-time popularity, and personal bookmark views are present and usable.
- The UX category test returned four UX questions only. Combining UX with the Research label returned two matching questions.
- The Popular view returned descending all-time counts: 35, 34, 32, 29, 29, 28, 27, 27 for the first eight rows.
- All rendered `Popular recently` labels reported at least three saves; observed values ranged from three to five in the prototype dataset.
- A bookmark remained saved after reload through browser-local persistence and appeared in `My bookmarks`.
- Stable question routes loaded directly and preserved the question answer, sources, edition, related questions, and bookmark state.
- Navigation and filters use semantic links, buttons, labels, selects, headings, and regions. Mobile controls meet the 44 pixel target and the category rail remains horizontally available.
- Browser console checks returned no warnings or errors on archive and detail routes.

## Comparison history

- The first archive pass displayed raw markdown emphasis markers in answer excerpts. They were stripped before presentation.
- The first source-count pass used a fixed plural. It now renders `1 source` and pluralizes larger counts correctly.
- The first route QA pass retained the previous scroll position after direct navigation in the test browser. The detail component resets the page to the top on route change, and direct-load verification passed.

## Verification

- `npm run build`: passed and emitted `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
- `npm test`: 16 of 16 tests passed.
- `npm run test:sites`: 4 of 4 tests passed.
- `git diff --check`: passed.

final result: passed
