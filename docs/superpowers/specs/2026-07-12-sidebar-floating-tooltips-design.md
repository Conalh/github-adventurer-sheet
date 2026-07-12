# Sidebar Floating Tooltips Design

**Date:** 2026-07-12

## Goal

Make every rich tooltip in the skills, equipment, backpack, and deed tabs fully visible on mouse hover and keyboard focus, even when it must extend outside the scrollable sidebar and over the game viewport.

## Root cause

Sidebar tooltips are absolutely positioned inside `.tab-panel`, which scrolls vertically and hides horizontal overflow on desktop. The scrollport clips tooltip pixels before stacking order is considered, so increasing `z-index` cannot fix the problem.

## Design

- Add a shared `FloatingTooltip` component that leaves a marker beside its trigger but portals the visible tooltip to `document.body`.
- Discover the parent button from the marker, then show on pointer entry or focus and hide on pointer exit or focus loss.
- Measure the trigger and tooltip after display. Center above the trigger by default, flip below when the upper viewport has insufficient room, and clamp horizontal placement to an eight-pixel viewport margin.
- Recalculate while visible on sidebar scrolling or window resizing; dismiss when the trigger leaves the document.
- Preserve the existing rich tooltip content and visual styling through the `.rs-tooltip` class, adding a fixed-position floating variant above the complete client.
- Replace inline `.rs-tooltip` spans in `SkillsTab`, `EquipmentTab`, and `DeedsTab`. Other tabs have no rich sidebar tooltips.
- Keep click behavior and accessible button labels unchanged. Keyboard focus must produce the same tooltip as mouse hover.

## Verification

- Component tests cover portal rendering, above/below placement, horizontal clamping, hover, focus, and dismissal.
- Existing tab rendering tests confirm all tooltip content remains present during server rendering through inert marker content.
- Headless Chrome verifies the first equipment slot, left/right backpack items, skills, and deeds at desktop size with no clipping, console errors, or failed requests.
- Production verification repeats hover and keyboard-focus checks on the canonical domain.
