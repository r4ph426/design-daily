# Design QA: Gmail connection flow

## Findings

- No actionable P0, P1, or P2 findings remain.
- P3: the prototype simulates the handoff to Google's consent screen. Real OAuth, token storage, revocation callbacks, and mailbox synchronization remain production work by design.

## Evidence

- Source visual truth: `/Users/raphael.regli/Documents/ChatGPT/design-dojo/public/assets/design-daily-reference.png`, the existing implemented design system, and the user's request for a Gmail connection flow.
- Implemented view: browser-rendered captures from `http://localhost:4173/` in the current in-app browser tab. The browser tool did not expose screenshot filesystem paths.
- Desktop comparison viewport: 1484 × 1060 CSS px at browser density 1.
- Mobile validation viewport: 390 × 844 CSS px at browser density 1.
- Source pixels: 1484 × 1060. Desktop implementation CSS size: 1484 × 1060.
- Compared states: base page, permission review, newsletter source selection, empty selection, one-source completion, five-source completion, disconnect, and keyboard dismissal.
- Full-view comparison: the reference image and updated base page were displayed together in one comparison input at the same desktop viewport. The Gmail flow does not alter the underlying hero grid, image crop, signal row, footer, typography hierarchy, or color balance.
- Focused region comparison: permission, source-selection, and completion dialogs were inspected separately at desktop size. The permission dialog was also captured at 390 × 844 to confirm readable wrapping, scrolling, and usable controls.

## Fidelity surfaces

### Fonts and typography

- Clash Display remains applied to flow headings.
- Geist Mono remains applied to explanations, permission details, newsletter metadata, and privacy copy.
- Geist Pixel remains applied to the progress indicator, status values, compact actions, and source count.
- All flow copy uses sentence case. No em dashes are used.

### Spacing and layout rhythm

- The dialog uses the existing square editorial surface, one-pixel borders, cobalt offset, and dense spacing system.
- The three-step progress indicator, permission rows, source list, actions, and completion summary align to one shared content width.
- The desktop dialog remains within the viewport. On mobile it is capped to the available height and scrolls internally without horizontal overflow.

### Colors and visual tokens

- Existing cobalt, coral, lavender, black, off-white, green success, and gray divider tokens are reused.
- Active steps and selected source metadata use lavender. The primary continuation path uses coral. Success uses the established green status color.

### Image quality and asset fidelity

- The flow does not introduce new imagery. The supplied hero image and transparent seal remain unchanged behind the modal treatment.
- Phosphor icons are used for mail, privacy, completion, navigation, and close controls.

### Copy and content

- The permission step distinguishes Google's read-only Gmail authorization from the product's narrower behavior of importing only approved senders.
- The flow explicitly states that it cannot send, edit, or delete email and that access can be disconnected.
- The source-selection step shows sender address, cadence, selected count, and a disabled completion action when no sources are selected.
- Completion reflects the actual number of selected senders rather than a fixed placeholder count.
- Prototype limitations are stated without asking users to enter credentials.

## Interaction and accessibility checks

- Verified the complete path from Connect Gmail to permission review, source selection, and completion.
- Verified checkbox selection and deselection, live selected count, zero-selection disabled state, one-source completion, and disconnect.
- Verified backdrop close, close button, Back action, and Escape key dismissal.
- The dialog traps Tab focus within its enabled buttons and inputs, then restores focus when closed.
- Native checkboxes, semantic dialog labeling, visible focus styles, and mobile tap targets are present.
- Browser console check returned no warnings or errors.

## Comparison history

- First flow pass used a fixed count of 18 sources in the completion state regardless of source selection. This was a P2 content and trust mismatch.
- Fix: the selected source count is now passed into the connected state and pluralized correctly. The completion summary shows the actual approved sender count.
- First accessibility pass supported pointer dismissal but did not constrain keyboard focus. This was a P2 modal behavior gap.
- Fix: Escape dismissal, Tab focus containment, and previous-focus restoration were added and verified.
- Post-fix evidence: the full flow completes with accurate counts, the zero-selection state blocks completion, mobile content remains accessible through internal scrolling, and the browser console is clean.

## Implementation checklist

- Permission review complete.
- Google handoff explained as a prototype.
- Newsletter selection complete.
- Accurate connected state complete.
- Disconnect and keyboard behavior complete.
- Desktop, mobile, build, and browser checks complete.

final result: passed
