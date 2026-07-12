# Tooltip Layering and Portrait Scale Design

**Date:** 2026-07-12

## Goal

Make every cape, trophy, and award tooltip paint above all wall displays and the player portrait. Reduce the desktop portrait slightly from 180px to 165px without reintroducing collisions in the character stack.

## Root cause

`.wall-display-tooltip` has `z-index: 60`, but it is nested inside `.wall-display-item`, which is a positioned stacking context at `z-index: 1`. The player is positioned at `z-index: 10`, so the tooltip cannot escape its parent and remains behind the portrait and later-painted wall items.

## Design

- Keep the normal wall displays at their current layer.
- Raise only the active `.wall-display-item` on `:hover` or `:focus-within` to a layer above the player and sibling displays.
- Preserve the tooltip's existing position, content, and hover/focus behavior.
- Change the portrait CSS clamp from a 180px maximum to 165px and render/request dimensions at 165px. Keep the high-resolution GitHub source request and smooth image interpolation.
- Do not raise the entire trophy wall, add a React portal, or change mobile layout.

## Verification

- Add a CSS regression test proving hover and focus-within raise the parent display item above the player layer.
- Update the avatar-size regression test to require the 165px render size and CSS maximum.
- Run the complete test suite and production build.
- In real headless Chrome, verify Conalh and Torvalds at 1440px and 941px. Hover and keyboard-focus wall displays and confirm the tooltip is the topmost element where it crosses the portrait or another award.
- Confirm the smaller portrait leaves the overhead plaque, caption, and status orbs collision-free.
