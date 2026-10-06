# Guidance in design / daily

Selected on 6 October 2026. Guidance by [Streamline](https://streamlinehq.com/) is free under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The visible credit lives on Privacy. Original SVGs and pinned source URLs live in `public/icons/guidance/`.

Import named icons from `src/icons/index.jsx`. Fourteen roles use twelve original Guidance vectors: arrows, disclosure, search, clock, plus/minus, image, information, favourite and play. Close uses an independently authored X made of two diagonal lines in the same shared wrapper, including the large detail cursor. External-link controls use the diagonal arrow. Publisher left/right filenames are reversed visually; our aliases follow their geometry.

Twelve roles retain Phosphor because Guidance has no direct equivalent: bookmark, check, link, robot, more, zoom in/out, pan, shuffle, reset, pause and crosshair. Do not replace a role with an unrelated pictogram. The dependency remains for these fallbacks.

Geometry is preserved. Monochrome ink becomes currentColor. Regular strokes are 1.5 units on the 24-unit grid; bold 2, light 1, thin .25. The large detail cursor therefore keeps a light 1.5px stroke at 144px. Filled favourites use the original closed star path. Existing sizes, semantic labels, targets, keyboard behavior and shared colour tokens are unchanged.

All assets are served locally; no icon service or account connection is introduced. New callers use this shared layer so migration is explicit and inspectable through data-icon-library.
