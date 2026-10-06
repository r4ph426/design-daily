# Global point cursor and simple Close icons

6 October 2026. This release adds the shared fine-mouse pointer to all public routes and both application entries. It also replaces the outlined Guidance Close symbol with the shared two-line X. It does not publish the private inspiration prototype or alter routing, access, dependencies or deployment settings.

- Production/Sites build passed; all 40 existing tests passed, including packaging checks.
- Playwright/Chrome verified Today, Archive, Toolbox and Privacy: 10px coral point on passive surfaces, 24px on interactive controls, no native cursor overlap, keyboard restoration, native text entry and reduced-motion behavior. Emulated touch navigates without a point. No page errors.
- The shared Close X preserves icon sizes, currentColor, stroke weights, accessible labels and click behavior. The original outlined cross is removed from rendered data and the asset manifest.
- The local inspiration prototype uses the same shared X for the 22px heading control and 144px hover action. It retains its existing capture, images and action arrows. Those prototype changes and private screenshots remain local.
- Physical devices were not tested. Browser evidence stays in the working workspace's ignored `.private/inspiration-review/guidance/` folder.
