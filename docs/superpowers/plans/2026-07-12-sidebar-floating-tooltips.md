# Sidebar Floating Tooltips Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace clipped inline sidebar tooltips with one shared body-level floating tooltip used by skills, equipment, backpack, and deeds.

**Architecture:** `FloatingTooltip` keeps an inert marker inside each existing button and portals the visible surface to `document.body`. A pure positioning function centers above by default, flips below when necessary, and clamps to an eight-pixel viewport margin. Runtime listeners cover pointer hover, keyboard focus, scrolling, and resizing without changing the buttons' click or accessible-label behavior.

**Tech Stack:** React 19, React DOM portals, TypeScript, CSS, Vitest, Vite, headless Chrome.

## Global Constraints

- Rich tooltips may float over the game viewport.
- Equipment, backpack, skills, and deeds must share the same implementation.
- Mouse hover and keyboard focus must behave identically.
- Keep the desktop tab panel scroll behavior.
- Add no dependency and change no tooltip copy or click action.

---

### Task 1: Shared floating tooltip

**Files:**
- Create: `src/components/FloatingTooltip.tsx`
- Create: `src/components/FloatingTooltip.test.tsx`
- Modify: `src/App.css`

**Interfaces:**
- Produces: `FloatingTooltip({ children }: { children: ReactNode })` and `computeFloatingTooltipPosition(trigger, tooltip, viewport)`.
- Position result: `{ top: number; left: number; placement: "above" | "below" }`.

- [ ] **Step 1: Write failing pure positioning and SSR tests**

Test centered-above placement, top-edge flipping, horizontal clamping, and inert server marker output. The tests import the component and pure function before they exist.

- [ ] **Step 2: Run the focused test and confirm RED**

Run `npm test -- src/components/FloatingTooltip.test.tsx`.

Expected: module resolution fails because `FloatingTooltip.tsx` does not exist.

- [ ] **Step 3: Implement the pure position function**

Use an eight-pixel viewport margin and seven-pixel trigger gap:

```ts
const above = trigger.top - tooltip.height - 7;
const placement = above >= 8 ? "above" : "below";
const desiredTop = placement === "above" ? above : trigger.bottom + 7;
const top = clamp(desiredTop, 8, Math.max(8, viewport.height - tooltip.height - 8));
const centeredLeft = trigger.left + trigger.width / 2 - tooltip.width / 2;
const left = clamp(centeredLeft, 8, Math.max(8, viewport.width - tooltip.width - 8));
```

- [ ] **Step 4: Implement portal lifecycle**

The marker discovers its parent button. Native `pointerenter`, `pointerleave`, `focusin`, and `focusout` listeners toggle visibility. While open, measure after rendering and update on captured scroll and resize. Render the portal with class `rs-tooltip rs-tooltip--floating` and inline `top`/`left`.

- [ ] **Step 5: Replace clipped CSS with floating CSS**

Keep `.rs-tooltip` visual rules but remove its inline absolute placement. Add:

```css
.floating-tooltip-anchor { display: none; }
.rs-tooltip--floating {
  position: fixed;
  z-index: 1000;
  opacity: 1;
  pointer-events: none;
  transform: none;
}
```

- [ ] **Step 6: Run the focused test and confirm GREEN**

Run `npm test -- src/components/FloatingTooltip.test.tsx`.

Expected: all new tests pass.

### Task 2: Migrate every sidebar tooltip owner

**Files:**
- Modify: `src/components/tabs/EquipmentTab.tsx`
- Modify: `src/components/tabs/SkillsTab.tsx`
- Modify: `src/components/tabs/DeedsTab.tsx`
- Modify: `src/components/tabs/EquipmentTab.test.tsx`
- Modify: `src/App.css`

**Interfaces:**
- Consumes: `FloatingTooltip` from Task 1.
- Produces: no inline `.rs-tooltip` descendants inside the clipped `.tab-panel`.

- [ ] **Step 1: Write a failing migration contract**

Read the three tab source files and assert each imports and renders `FloatingTooltip`, and none contains `className="rs-tooltip"`.

- [ ] **Step 2: Run the tab test and confirm RED**

Run `npm test -- src/components/tabs/EquipmentTab.test.tsx`.

Expected: migration assertions fail against inline tooltip spans.

- [ ] **Step 3: Migrate the three tabs**

Replace each `<span className="rs-tooltip" role="presentation">...</span>` with `<FloatingTooltip>...</FloatingTooltip>`. Remove equipment's `tip-end` calculation and class suffix.

- [ ] **Step 4: Remove obsolete inline-tooltip CSS**

Delete child-hover opacity rules, the `tip-end` rule, and the old z-index lift block. Portal visibility and stacking now own those responsibilities.

- [ ] **Step 5: Run focused and full automated gates**

Run:

```powershell
npm test -- src/components/FloatingTooltip.test.tsx src/components/tabs/EquipmentTab.test.tsx
npm test
npm run build
git diff --check
```

Expected: all tests and the production build pass with a clean diff.

- [ ] **Step 6: Verify locally in headless Chrome**

At desktop size, test first/edge equipment slots, backpack items, skills, and deeds by hover and keyboard focus. For every open tooltip, assert its rectangle stays inside the viewport, it is outside `.tab-panel`, and `document.elementFromPoint()` returns the tooltip or its descendant. Confirm scroll/resize repositioning and zero console/network failures.

- [ ] **Step 7: Commit, review, merge, and deploy**

Commit the component and migrations, review all five quality axes, merge using the user's standing local-merge choice, push `main`, wait for Cloudflare Pages, and repeat the headless checks on `https://osrshub.conalhickey.com`.
