# Design QA: Toolbox

## Comparison target

- Source visual truth path: `/Users/raphael.regli/Documents/ChatGPT/design-dojo/public/assets/toolbox-layout-reference.png`
- Original supplied source: `/var/folders/qk/wyf2xq9d0z1b0pbvm4pqz0240000gq/T/codex-clipboard-867a651f-b9f1-4703-a7f4-bb55db4ba25e.png`
- Implementation screenshot evidence: Codex in-app browser capture of `http://localhost:4173/#/toolbox` in the current build session. The in-app browser does not expose a screenshot filesystem path.
- Comparison helper: `http://localhost:4173/qa-toolbox.html`
- Viewport: 1440 × 1024 CSS pixels, device scale factor 1.
- Source pixels: 1488 × 1058, normalized to the 1440 × 1024 CSS viewport without cropping.
- Implementation pixels: 1440 × 1024 browser viewport capture.
- State: Toolbox route, default search and filters, no saved tools, empty contribution field.

## Full-view comparison evidence

The selected source and browser-rendered implementation were opened and inspected at the same 1440 × 1024 desktop state. The implementation preserves the source hierarchy and proportions: two-row header, split editorial hero, dated three-column weekly strip, persistent `Our toolbox` heading and filters, and the 11% / 39% / 34% / 16% tool-row grid. The latest direction replaces the original sage canvas with warm paper, keeps sage for navigation and selection, uses black for typography, and limits yellow to the `Useful now` background highlight.

## Focused comparison evidence

- Header and hero: the final pass shows the shared current-edition date, Toolbox active state, broad two-line headline, and contribution form aligned to the same hairline grid as the source.
- Weekly strip: all three signals preserve the source number/title/verdict/summary/source anatomy. The highlighted verdict has a square yellow background and no underline.
- Persistent index: search, type filters, verdict controls, evidence columns, recommendation column, and bookmark row match the source density and alignment.
- No image-focused crop was needed because the target contains no editorial photography, illustration, or product imagery. The only visible symbols are supplied Phosphor interface icons.

## Comparison history

### Pass 1

- [P2] Toolbox header inherited edition number and filed-time metadata, while the source shows only the date.
  - Fix: scoped the Toolbox header to `Friday, 25 September 2026` and removed the extra edition metadata from this route.
- [P2] Persistent tool rows were too tall, moving the third row materially farther below the fold than the source.
  - Fix: tightened row padding, display size, fact spacing, recommendation leading, and bookmark-row height without reducing the 11px interface type floor.

### Pass 2

- Post-fix browser evidence shows no remaining actionable P0, P1, or P2 mismatch.
- Remaining rasterization differences between the generated reference and browser-rendered Neue Reckless are acceptable P3-level rendering variance.

### Pass 3: merged shell and control consistency

- Verified that Today, Archive, and Toolbox still render through one two-row header with the correct persistent active state.
- Replaced the Toolbox-specific `Add to review` language with the shared `Contribute to the next crawl` / `Add to crawl` pattern.
- Unified Today and Toolbox contribution controls at 48px with the same square geometry, typography, focus, active, and mobile stacking behavior.
- At 390px, the full edition date crowded the brand and header actions. The header now swaps only the date label to a compact `D Mon YYYY` form on mobile; the structure and desktop treatment remain unchanged.

### Pass 4: shared-header design critique

- [P1] Two generations of header CSS defined different grids, heights, padding, and responsive behavior. The visual result depended on cascade order rather than one component contract.
  - Fix: consolidated the header into one desktop definition and one mobile definition shared by Today, Archive, and Toolbox.
- [P2] Search and Bookmarks competed with edition metadata in the global chrome even though search belongs to Archive and personal saves already live in context.
  - Fix: removed both header utilities and gave the brand/date row a stable 42% / 58% grid.
- [P2] Toolbox used a paper-filled active tab while Today and Archive used a restrained surface highlight.
  - Fix: kept the Toolbox palette but reused the same active-state logic and dimensions as the daily surfaces.
- [P2] Toolbox metadata fell below the documented 11px type floor and its bookmark control was shorter than comparable actions.
  - Fix: moved metadata to `--t-meta`, raised the bookmark row to 44px, and normalized filter targets to 44px.
- [P2] The header changed dates and metadata density between routes, making Toolbox feel like a separate microsite.
  - Fix: every route now uses the same current-edition date, with no route-specific edition or filing metadata in the shared chrome. Header interface copy uses one 12px scale while editorial metadata retains the 11px floor.

### Pass 5: shared page-opening design critique

- [P1] The three primary routes implemented their opening sections independently. At 1280px, Today used a 52px title with no eyebrow and 38px / 20px inset, Archive used a 78px title with a 52px / 22px inset, and Toolbox used a 64px title with a 12px / 26px inset.
  - Fix: all three routes now use the same `page-opening`, `page-opening-main`, `page-opening-aside`, eyebrow, title-line, and summary classes.
- [P2] Desktop splits varied between 44% / 56%, 64% / 36%, and 59% / 41%, while section heights ranged from roughly 230px to 371px.
  - Fix: every route uses a 64% / 36% split and 360px minimum height. Page-specific content may grow the section, but the baseline frame is shared.
- [P2] Responsive behavior diverged: Today collapsed at 1200px while Archive and Toolbox held two columns until mobile.
  - Fix: the shared layout holds through tablet and every route collapses at the same 720px breakpoint with the same 46px title, 16px summary, and 30px / 20px inset.

### Pass 6: paper Toolbox, coral contribution, and shared footer

- Replaced the sage Toolbox canvas with warm paper while retaining sage for all navigation tabs and selected filters. Structural rules now use a light sage mix; controls retain a stronger neutral boundary where needed.
- Restored the same coral `Add to crawl` fill on Today and Toolbox. The rendered ink-on-coral pair measures 5.74:1.
- Replaced the Toolbox-only metadata footer with one shared three-cell footer on every route: coral editorial claims around an underlined sage Privacy link with an arrow.
- Measured the shared footer on its forest surface: the brighter coral text token is 4.60:1 and the sage Privacy link is 9.79:1.
- At 390px, the shared footer stacks into three full-width rows. At 320px, Toolbox reports no horizontal overflow and all navigation targets remain 48px tall.

### Pass 7: white Toolbox reskin and compact AI label

- Reskinned Toolbox to a pure white canvas with subtle neutral grey/black rules, including the shared footer.
- Kept Toolbox navigation white in its resting and active states; the persistent underline now carries the active state without a filled tab.
- Retained coral only for the shared `Add to crawl` action and contrast-adjusted footer statements.
- Shortened the shared yellow AI-lens badge label from `AI lens` to `AI` while retaining its robot icon and semantic role.
- Removed the remaining forest and sage treatments from Toolbox. The brand and status text now use ink, while selected and empty-state filter actions use yellow.
- Applied the Toolbox light theme to `html` and `body` as well as the capped shell so wide viewports cannot expose forest-colored outer gutters.
- Refined the Toolbox tablet state: the masthead brand uses exact Tangity coral `#FF3318`, weekly signals stack vertically at 1200px, selected filters use sage, and the active Toolbox tab combines a neutral fill with a heavier label and inset ink rule.
- Unified the shared navigation active state across Today, Archive, and Toolbox: each uses a subtle fill, heavier label, and three-pixel inset rule; the dark routes use sage and Toolbox uses ink.

## Required fidelity surfaces

### Fonts and typography

- Neue Reckless Regular and Light Italic are self-hosted and used for editorial headlines, tool names, verdicts, and expressive numerals.
- Inter remains the only interface and metadata family.
- Headline wrapping, open display leading, compact evidence labels, and the 11px interface floor match the selected direction.

### Spacing and layout rhythm

- Desktop grid, hairline divisions, square controls, and section order match the source.
- The 1200px and 720px responsive states were checked. At 390px and 720px the document and shell report no horizontal overflow; filters become scrollable or stacked and controls retain at least 44px targets.
- The shared header also passes at the 320px minimum: brand and compact date remain separate, every navigation target is 48px tall, and horizontal overflow remains zero.

### Colors and visual tokens

- Toolbox is scoped to Tangity paper, sage, black, dark forest, coral, and yellow tokens.
- Coral appears only on the Toolbox contribution action and shared footer claims; it is not used for tool rankings, rows, or navigation.
- No gradients, drop shadows, glass surfaces, black panels, or rounded SaaS cards were introduced.
- Measured Toolbox navigation contrast is 13.06:1 for inactive tabs and 11.00:1 for the active tab.

### Image quality and asset fidelity

- The selected screen contains no raster content that needs recreation.
- Search, bookmark, check, and external-link symbols use the existing Phosphor icon dependency rather than custom SVG or CSS drawings.
- The supplied visual target is retained as a project QA reference asset without being shipped as interface content.

### Copy and content

- Weekly discovery and persistent-toolbox copy follow the approved two-layer editorial model.
- `New this week`, `What’s new and sparking our interest`, `Our toolbox`, verdicts, source provenance, and recommendation fields match the selected source.

## Interaction and accessibility checks

- Search reduced the collection to the expected `Playwright MCP` result.
- `Best practice` returned both matching tools and toggled back to the full five-tool collection.
- Bookmarking changed the accessible label and pressed state to `Bookmarked`, then reset correctly.
- A valid contribution URL produced `Added to next week’s crawl.`; clearing the field restored the default form state.
- Navigation exposes a persistent Toolbox active state and semantic links.
- Today and Toolbox use the same `Add to crawl` action label and contribution-control anatomy.
- Invalid tool URLs show an inline alert, valid tool URLs show the polite success state, and keyboard focus on the contribution action renders a 2px ink outline with a 4px yellow halo.
- Today, Archive, and Toolbox expose the same three footer items in the accessibility tree.
- The browser console returned no warnings or errors.

## Verification

- `npm run build`: passed and emitted `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
- `npm test`: 18 of 18 tests passed.
- `npm run test:sites`: 4 of 4 tests passed.
- `git diff --check`: passed.
- Primary browser interactions: passed.
- Console errors: none.

## Follow-up polish

- P3: replace illustrative repository examples with crawler-produced weekly data when the editorial pipeline is connected.

final result: passed
