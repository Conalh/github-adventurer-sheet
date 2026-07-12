# Stable Client Frame and Sharp Avatar Design

## Goal

Keep the desktop inn at a stable size when switching sidebar tabs, and render GitHub portraits smaller and sharply instead of enlarging a deliberately pixelated 96px source.

## Root Causes

The desktop `.client-body` grid stretches both columns to the height of its tallest child. The equipment panel's worn slots and backpack exceed the sidebar's nominal panel height, so selecting that tab expands the sidebar and stretches the inn from its intended 520px height.

The portrait helper requests a 96px GitHub avatar while CSS displays it at up to 220px and applies `image-rendering: pixelated`. The browser therefore enlarges a low-resolution source and preserves hard source pixels.

## Desktop Frame Behavior

At widths of 941px and above, the client body, viewport, and sidebar use a stable 520px height. The tab strip remains fixed at the top of the sidebar. The tab panel fills the remaining sidebar height and scrolls vertically when its content is taller than the available space.

Switching among summary, skills, quests, equipment, and deeds must not change the viewport height, move the chatbox, or vertically stretch the inn. The equipment tab retains every worn slot and inventory entry; scrolling changes presentation only and does not cap or hide data.

At widths below 941px, the existing stacked fallback remains content-sized. This pass does not introduce a fixed-height mobile sidebar or otherwise redesign mobile behavior.

## Avatar Rendering

The portrait's desktop maximum becomes 180px instead of 220px. It remains centered over the rug, keeps a square aspect ratio, and preserves the existing border, shadow, fallback initials, context menu, nameplate, and worn-cape layering.

The avatar URL requests a 460px source from GitHub. Normal browser image interpolation replaces `image-rendering: pixelated` for photographic avatars. The larger source provides sufficient density for the 180px display on high-density screens without adding a new request path or dependency.

The initials fallback continues to use the same 180px geometry and pixel-style typography; only remote photographic avatars use smooth interpolation.

## Accessibility and Interaction

The sidebar's internal scrolling remains keyboard- and wheel-accessible. Focused inventory controls must scroll into view naturally. Tooltips, tab semantics, portrait menu behavior, and accessible labels remain unchanged.

The scroll container must not trap horizontal overflow or create a second page-level horizontal scrollbar.

## Verification

Implementation follows test-driven development. Automated tests must verify:

- the avatar helper requests a 460px source;
- photographic avatars no longer use pixelated interpolation;
- the desktop client, scene, and sidebar share the 520px frame contract;
- the tab panel is the vertical scroll container;
- the sub-941px fallback resets the fixed desktop height; and
- switching to the equipment tab does not change the viewport's rendered height.

The full test suite and production build must pass. Real installed-Chrome acceptance runs at 1440x1000, compares the skills and equipment tabs, confirms an unchanged 520px viewport, verifies a 180px sharp portrait, scrolls the equipment panel, focuses an offscreen inventory item, and checks for console errors, failed requests, or horizontal overflow.
