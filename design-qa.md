# Design QA

## Scope

- Reference: selected 2.1-A modular editorial direction (`exec-a1a62916-de1d-494a-a929-c52056f1aed6.png`).
- Surfaces checked in the local in-app browser: Today and Archive at desktop width, the collapse-grid-expand route transition, persistent header, active navigation, question disclosure controls, and Archive retrieval surface.
- Responsive implementation inspected at the 1200px and 720px CSS transitions.

## Visual fidelity

- Passed: at the 1488 × 1058 reference viewport, Today uses the approved five-track 24% / 17% / 18% / 17% / 24% scaffold with a three-track headline, one-track crawl point of view, and one-track article intake over the subtler seven-module field.
- Passed: the headline resolves to three intentional lines and uses Neue Reckless with the final line in italic.
- Passed: the first question uses the measured 15.4% / 43.7% / 25.7% / 15.2% composition for numeral, editorial copy, provenance, and the circular discussion action.
- Passed: coral numerals, warm paper typography, forest canvas, subtle olive rules, sage links, yellow AI lens, and coral crawl action all reuse the shared tokens.
- Passed: Archive recombines the same field into a distinct four / two / one opening followed by a four-column `Start here` set.
- Passed: structural rules reach the literal viewport edges while the opening title remains a clean protected surface; no rule crosses text or controls, and there is no cropped or ghosted background typography.

## Interaction and motion

- Passed: the two-row header remains persistent while content scrolls inside the route stage.
- Passed: Today and Archive share one non-lateral stage; horizontal scrolling and swipe navigation are absent.
- Passed: the current cells collapse, the seven-by-four grid is briefly exposed, and the destination cells expand with a restrained stagger in their own layout.
- Passed: the destination resets to its top during the grid beat, while the header active state and URL provide immediate static feedback.
- Passed: reduced-motion mode replaces the route immediately, and mobile uses the same header-driven navigation without swipe.

## Accessibility and resilience

- Passed: semantic headings, labeled navigation, URL form labels, bookmarks, disclosure state, and skip links remain intact.
- Passed: all existing focus rings, keyboard controls, and 44px mobile targets remain in place.
- Passed: browser console contained no warnings or errors during route navigation.
- Passed: production build, unit tests, and Sites packaging tests all completed successfully.

## Findings

- P0: none.
- P1: none.
- P2: none after tightening the edition summary, question measure, and modular title wrapping during the visual pass.

Final result: passed
