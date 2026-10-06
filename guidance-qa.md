# Guidance icon release verification

6 October 2026. Scope: free Guidance originals, shared React icon layer, existing icon import sites, visible CC BY 4.0 credit and design documentation. No dependency, routing, access model, crawler or deployment configuration changes.

- Fifteen icon roles use thirteen publisher SVGs, pinned to upstream commit 52d750c9ce051e51cb181b7a78932120c48541d0. Twelve roles retain Phosphor where Guidance has no matching pictogram.
- Production and GitHub Pages builds passed. All 40 existing release tests passed, including the four Sites packaging checks.
- The exact release build was checked with Playwright/Chrome at 1360 × 1000 and 390 × 844 on Today, Archive, Toolbox and Privacy. Every route rendered Guidance with no horizontal overflow or uncaught page errors.
- Source disclosure opened and closed with the straight Guidance down arrow. Archive search produced an empty result and recovered; bookmarks toggled and were restored. Visible publisher and license links were verified on Privacy.
- The separate local inspiration prototype uses this same icon layer. Its Previous, Close and Next cursor zones rendered the 144px thin Guidance marks; Escape restored the canvas. Its private captures, prototype files and browser screenshots are not part of this release.
- Browser evidence remains in the working workspace's ignored `.private/inspiration-review/guidance/` folder. Mobile verification used browser widths; physical devices were not tested.
