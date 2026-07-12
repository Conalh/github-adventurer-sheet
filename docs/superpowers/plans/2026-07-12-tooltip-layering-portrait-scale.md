# Tooltip Layering and Portrait Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render every active wall tooltip above the portrait and neighboring awards while reducing the desktop portrait from 180px to 165px.

**Architecture:** Keep the existing DOM and tooltip positioning. Fix the actual stacking-context boundary by raising only the hovered or focus-containing `.wall-display-item` above `.player`; retain the tooltip's internal layer. Resize the portrait through its rendered dimensions and CSS clamp while preserving the `s=460` source request.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Vite, headless Chrome via the existing Puppeteer harness.

## Global Constraints

- Tooltips must cover the portrait, capes, trophies, and awards on hover and keyboard focus.
- The active wall item is raised only while hovered or focus-containing.
- Portrait render size and CSS maximum are exactly 165px.
- Keep the high-resolution GitHub avatar request and `image-rendering: auto`.
- Do not change tooltip copy, introduce a portal, raise the whole trophy wall, or redesign mobile.

---

### Task 1: Active tooltip layer and portrait scale

**Files:**
- Modify: `src/components/TrophyWall.test.tsx`
- Modify: `src/components/Viewport.test.tsx`
- Modify: `src/components/Viewport.tsx`
- Modify: `src/App.css`

**Interfaces:**
- Consumes: existing `.wall-display-item`, `.wall-display-tooltip`, `.player`, `.player-avatar`, and `pixelAvatar()` behavior.
- Produces: hover/focus parent stacking above the player and a 165px rendered portrait.

- [ ] **Step 1: Write the failing tooltip stacking test**

Add to `src/components/TrophyWall.test.tsx`:

```tsx
it("raises the active wall display above the player and neighboring awards", () => {
  const styles = readFileSync(new URL("../App.css", import.meta.url), "utf8");
  const activeItem = styles.match(
    /\.wall-display-item:hover,\s*\.wall-display-item:focus-within\s*\{[^}]*z-index:\s*(\d+)/s,
  );
  const player = styles.match(/\.player\s*\{[^}]*z-index:\s*(\d+)/s);

  expect(activeItem).not.toBeNull();
  expect(player).not.toBeNull();
  expect(Number(activeItem?.[1])).toBeGreaterThan(Number(player?.[1]));
});
```

- [ ] **Step 2: Update the portrait regression test to require 165px**

In `src/components/Viewport.test.tsx`, change the existing avatar assertions to:

```tsx
expect(markup).toContain("https://avatars.githubusercontent.com/u/1?v=4&amp;s=460");
expect(markup).toContain('width="165"');
expect(markup).toContain('height="165"');
expect(styles).toMatch(/\.player-avatar\s*\{[^}]*width:\s*clamp\(145px,\s*18vw,\s*165px\)/s);
expect(styles).toMatch(/\.player-avatar\s*\{[^}]*image-rendering:\s*auto/s);
expect(styles).not.toMatch(/\.player-avatar\s*\{[^}]*image-rendering:\s*pixelated/s);
```

- [ ] **Step 3: Run the focused tests and confirm RED**

Run:

```powershell
npm test -- src/components/TrophyWall.test.tsx src/components/Viewport.test.tsx
```

Expected: the new stacking test fails because the active parent layer rule is absent, and the avatar test fails because the portrait still renders at 180px.

- [ ] **Step 4: Implement the minimal stacking-context fix**

In `src/App.css`, immediately after `.wall-display-item`, add:

```css
.wall-display-item:hover,
.wall-display-item:focus-within { z-index: 80; }
```

This places only the active wall display above `.player { z-index: 10; }` and all inactive `.wall-display-item { z-index: 1; }` siblings.

- [ ] **Step 5: Reduce the portrait render and CSS sizes**

In `src/components/Viewport.tsx`, change the avatar dimensions to:

```tsx
width={165}
height={165}
```

In `src/App.css`, change the `.player-avatar` width to:

```css
width: clamp(145px, 18vw, 165px);
```

Preserve its aspect ratio and `image-rendering: auto`.

- [ ] **Step 6: Run the focused tests and confirm GREEN**

Run:

```powershell
npm test -- src/components/TrophyWall.test.tsx src/components/Viewport.test.tsx
```

Expected: all focused tests pass.

- [ ] **Step 7: Run full automated verification**

Run:

```powershell
npm test
npm run build
git diff --check
```

Expected: 165 tests pass, the production build succeeds, and the diff check is clean.

- [ ] **Step 8: Verify rendered behavior in headless Chrome**

At 1440x1000 for Conalh and 941x1000 for Torvalds:

1. Load the character route with no framework overlay, console error, or failed request.
2. Hover a cape and an award; confirm the visible `.wall-display-tooltip` is topmost at a point where it overlaps another display or the portrait.
3. Tab-focus a wall display; confirm the same topmost behavior through `:focus-within`.
4. Confirm overhead plaque, 165px portrait, caption, and status-orb bounding boxes do not overlap.
5. Capture after screenshots for both widths.

- [ ] **Step 9: Commit the implementation**

```powershell
git add src/App.css src/components/TrophyWall.test.tsx src/components/Viewport.test.tsx src/components/Viewport.tsx
git commit -m "fix: lift wall tooltips above the player"
```

- [ ] **Step 10: Review, merge, deploy, and prove production**

1. Review the branch across correctness, readability, architecture, security, and performance.
2. Merge the branch to `main` without touching the user's existing dirty files.
3. Run the full test suite and build on the merged result.
4. Push `main` and wait for the Cloudflare Pages workflow.
5. Confirm the latest production deployment source matches the merged SHA.
6. Repeat the tooltip topmost and portrait geometry checks on `https://osrshub.conalhickey.com`.
