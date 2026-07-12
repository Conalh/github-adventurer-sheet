# Stable Client Frame and Sharp Avatar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop tall sidebar tabs from stretching the desktop inn and render the GitHub portrait at a smaller, sharp photographic resolution.

**Architecture:** Keep the existing two-column client and data flow. A desktop-only CSS frame constrains the scene and sidebar to 520px while making `.tab-panel` the vertical scroll owner; `Viewport` requests a 460px avatar and displays it at a 180px maximum with normal interpolation.

**Tech Stack:** React 19, TypeScript 5.8, CSS, Vitest, Vite 7, installed Chrome

## Global Constraints

- Desktop behavior applies at widths of 941px and above; the existing sub-941px stacked fallback remains content-sized.
- The client body, viewport, and sidebar use a stable 520px desktop height.
- The portrait maximum is 180px and its GitHub source request is 460px.
- Preserve every inventory item, existing tab semantics, portrait context menu, nameplate, worn-cape layering, tooltips, and fallback initials.
- Add no dependency and make no changes to GitHub data fetching or character formulas.
- The equipment panel scrolls vertically without creating horizontal or page-level overflow.

---

## File Structure

- Modify `src/components/Viewport.tsx`: request the larger avatar source and align intrinsic dimensions with the new display size.
- Modify `src/components/Viewport.test.tsx`: verify source resolution and photographic rendering contract.
- Modify `src/App.css`: add the desktop frame, sidebar scroll containment, portrait size, interpolation, and mobile boundary.
- Create `src/components/GameClient.test.tsx`: verify the desktop frame and responsive scroll ownership contracts.

### Task 1: Stable frame and sharp portrait

**Files:**
- Modify: `src/components/Viewport.tsx`
- Modify: `src/components/Viewport.test.tsx`
- Modify: `src/App.css`
- Create: `src/components/GameClient.test.tsx`

**Interfaces:**
- Consumes: the existing GitHub avatar URL and existing `.client-body`, `.viewport`, `.sidebar`, and `.tab-panel` structure.
- Produces: `pixelAvatar(avatarUrl)` URLs ending in `s=460`, a 180px portrait contract, and a 520px desktop client with an internally scrolling tab panel.

- [ ] **Step 1: Write failing avatar tests**

Add to `src/components/Viewport.test.tsx`:

```tsx
it("requests a high-resolution avatar and renders it at the compact size", () => {
  const withAvatar = {
    ...fixture,
    user: {
      ...fixture.user,
      avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
    },
  } as CharacterSheet;
  const markup = renderToStaticMarkup(
    <Viewport sheet={withAvatar} say={() => undefined} />,
  );
  const styles = readFileSync(new URL("../App.css", import.meta.url), "utf8");

  expect(markup).toContain("https://avatars.githubusercontent.com/u/1?v=4&amp;s=460");
  expect(markup).toContain('width="180"');
  expect(markup).toContain('height="180"');
  expect(styles).toMatch(/\.player-avatar\s*\{[^}]*width:\s*clamp\(150px,\s*20vw,\s*180px\)/s);
  expect(styles).toMatch(/\.player-avatar\s*\{[^}]*image-rendering:\s*auto/s);
  expect(styles).not.toMatch(/\.player-avatar\s*\{[^}]*image-rendering:\s*pixelated/s);
});
```

- [ ] **Step 2: Write failing frame tests**

Create `src/components/GameClient.test.tsx`:

```tsx
// @ts-expect-error The app intentionally omits Node typings; Vitest supplies this at runtime.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function mediaBlock(styles: string, query: string): string {
  const start = styles.indexOf(`@media ${query}`);
  if (start < 0) return "";
  const open = styles.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < styles.length; index += 1) {
    if (styles[index] === "{") depth += 1;
    if (styles[index] === "}") depth -= 1;
    if (depth === 0) return styles.slice(open + 1, index);
  }
  return "";
}

describe("GameClient desktop frame", () => {
  it("contains tall tabs inside a stable desktop scene", () => {
    const styles = readFileSync(new URL("../App.css", import.meta.url), "utf8");
    const desktop = mediaBlock(styles, "(min-width: 941px)");

    expect(desktop).toMatch(/\.client-body\s*\{[^}]*height:\s*520px/s);
    expect(desktop).toMatch(/\.viewport\s*\{[^}]*height:\s*100%[^}]*min-height:\s*0/s);
    expect(desktop).toMatch(/\.sidebar\s*\{[^}]*height:\s*100%[^}]*min-height:\s*0/s);
    expect(desktop).toMatch(/\.tab-panel\s*\{[^}]*min-height:\s*0[^}]*overflow-x:\s*hidden[^}]*overflow-y:\s*auto/s);
  });

  it("keeps the fixed frame out of the stacked fallback", () => {
    const styles = readFileSync(new URL("../App.css", import.meta.url), "utf8");
    const mobile = mediaBlock(styles, "(max-width: 940px)");

    expect(mobile).toMatch(/\.client-body\s*\{[^}]*grid-template-columns:\s*1fr/s);
    expect(mobile).not.toMatch(/\.client-body\s*\{[^}]*height:\s*520px/s);
    expect(mobile).toMatch(/\.tab-panel\s*\{[^}]*min-height:\s*0/s);
  });
});
```

- [ ] **Step 3: Run focused tests and confirm RED**

Run: `npm test -- src/components/Viewport.test.tsx src/components/GameClient.test.tsx`

Expected: FAIL because the avatar still requests 96px, renders at 220px with pixelated interpolation, and no desktop fixed-frame media rule exists.

- [ ] **Step 4: Implement the avatar correction**

In `src/components/Viewport.tsx`, change the image dimensions and URL helper:

```tsx
<img
  src={pixelAvatar(sheet.user.avatar_url)}
  alt=""
  className="player-avatar"
  width={180}
  height={180}
/>
```

```tsx
function pixelAvatar(avatarUrl: string): string {
  const separator = avatarUrl.includes("?") ? "&" : "?";
  return `${avatarUrl}${separator}s=460`;
}
```

In `src/App.css`, update `.player-avatar`:

```css
.player-avatar {
  position: relative;
  z-index: 5;
  display: block;
  width: clamp(150px, 20vw, 180px);
  height: auto;
  aspect-ratio: 1;
  border: 2px solid rgba(0, 0, 0, 0.55);
  border-radius: 4px;
  object-fit: cover;
  image-rendering: auto;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.45);
}
```

- [ ] **Step 5: Implement desktop containment**

Add before the existing `@media (min-width: 941px) and (max-width: 1120px)` block in `src/App.css`:

```css
@media (min-width: 941px) {
  .client-body {
    height: 520px;
  }

  .viewport {
    height: 100%;
    min-height: 0;
  }

  .sidebar {
    height: 100%;
    min-height: 0;
  }

  .tab-panel {
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
  }
}
```

Leave the existing `@media (max-width: 940px)` `.client-body`, `.viewport`, and `.tab-panel` declarations content-sized; the desktop height rule does not apply below 941px.

- [ ] **Step 6: Run focused tests and confirm GREEN**

Run: `npm test -- src/components/Viewport.test.tsx src/components/GameClient.test.tsx`

Expected: both files pass.

- [ ] **Step 7: Run all automated gates**

Run: `npm test && npm run build && git diff --check`

Expected: all tests pass, the TypeScript/Vite production build succeeds, and no whitespace errors are reported.

- [ ] **Step 8: Run installed-Chrome comparison acceptance**

Serve the production build and inspect `/character/Conalh` at 1440x1000. Record these assertions before and after selecting the equipment tab:

```text
.viewport height is 520px in both states.
.sidebar height is 520px in both states.
.player-avatar is 180px square, naturalWidth is at least 360px, and image-rendering is auto.
.tab-panel has overflow-y auto; equipment scrollHeight exceeds clientHeight.
Scrolling the equipment panel changes scrollTop without moving the page or viewport.
Focusing an initially offscreen inventory item scrolls it into view.
There is no document horizontal overflow.
The portrait menu, nameplate, worn cape, inventory tooltips, and tab semantics still work.
Console errors, page errors, failed requests, and non-200 app/GitHub responses are empty.
```

Capture skills-tab and equipment-tab screenshots as ignored artifacts under `.superpowers/sdd/`.

- [ ] **Step 9: Fix acceptance defects with a failing regression assertion first**

If the browser exposes a defect, add the narrowest failing assertion to `Viewport.test.tsx` or `GameClient.test.tsx`, run it to confirm RED, implement the smallest fix, and rerun the focused tests plus browser comparison. Do not redesign inventory density or mobile layout.

- [ ] **Step 10: Commit the verified fix**

```bash
git add src/App.css src/components/Viewport.tsx src/components/Viewport.test.tsx src/components/GameClient.test.tsx
git commit -m "fix: stabilize the client frame and avatar"
```
