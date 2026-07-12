# Top-Down OSRS Inn Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the desktop character scene as a top-down OSRS-style timber inn while preserving the large GitHub portrait and replacing flat cape wedges with illustrated, skill-specific garments.

**Architecture:** Add a focused `SkillcapeArt` renderer for reusable SVG garment geometry and a focused `InnRoom` component for decorative scenery. Keep achievement derivation unchanged; `Viewport` composes the room, portrait, worn cape, and existing `TrophyWall`, while CSS assigns the top-down composition and explicit stacking order.

**Tech Stack:** React 19, TypeScript 5.8, SVG, CSS, Vitest, React server rendering, Vite 7

## Global Constraints

- Desktop only: support widths of 941 pixels and wider, with primary acceptance at 1440 by 1000.
- Preserve the existing GitHub portrait, portrait context menu, nameplate, trophy records, trophy thresholds, and GitHub request paths.
- Add no canvas renderer, fixed background illustration, third-party art package, or new runtime dependency.
- Keep all earned capes and trophies visible, focusable, tooltip-enabled, and free of overlap at the supported desktop viewport.
- Mobile layout remains deferred; preserve the existing smaller-screen fallback without treating it as an acceptance target.
- Decorative room elements must be hidden from assistive technology and ignore pointer events.

---

## File Structure

- Create `src/components/SkillcapeArt.tsx`: palette lookup, fallback behavior, reusable garment SVG, and skill emblem composition.
- Create `src/components/SkillcapeArt.test.tsx`: artwork metadata, trim state, emblem, and fallback tests.
- Create `src/components/InnRoom.tsx`: semantic-free decorative room structure.
- Create `src/components/InnRoom.test.tsx`: scenery structure and accessibility-boundary tests.
- Modify `src/components/TrophyWall.tsx`: replace cape placeholders with `SkillcapeArt` while preserving display controls and tooltips.
- Modify `src/components/TrophyWall.test.tsx`: verify illustrated capes and unchanged trophy interactions.
- Modify `src/components/Viewport.tsx`: compose `InnRoom`, reuse `SkillcapeArt` for the worn cape, and preserve character interactions.
- Modify `src/components/Viewport.test.tsx`: verify composition and stacking contracts.
- Modify `src/App.css`: remove the front-facing inn rules and add top-down room, furniture, cape, display-zone, and depth styling.

---

### Task 1: Reusable Skillcape artwork

**Files:**
- Create: `src/components/SkillcapeArt.tsx`
- Create: `src/components/SkillcapeArt.test.tsx`

**Interfaces:**
- Consumes: `SkillName`, `SKILL_COLORS`, and `SKILL_ICONS`.
- Produces: `SkillcapeArt({ skill, trimmed, variant, className })`, where `skill: SkillName | string`, `trimmed: boolean`, and `variant: "wall" | "worn"`.
- Produces: `getSkillcapePalette(skill: SkillName | string): SkillcapePalette` for deterministic artwork and neutral fallback testing.

- [ ] **Step 1: Write failing artwork tests**

Create `src/components/SkillcapeArt.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SKILL_NAMES } from "../lib/githubCharacter";
import { SkillcapeArt, getSkillcapePalette } from "./SkillcapeArt";

describe("SkillcapeArt", () => {
  it("renders garment geometry and a distinct emblem for every supported skill", () => {
    const markup = SKILL_NAMES.map((skill) =>
      renderToStaticMarkup(
        <SkillcapeArt skill={skill} trimmed={false} variant="wall" />,
      ),
    );

    expect(new Set(SKILL_NAMES.map((skill) => getSkillcapePalette(skill).body)).size)
      .toBe(SKILL_NAMES.length);
    for (const [index, skill] of SKILL_NAMES.entries()) {
      expect(markup[index]).toContain(`data-skill="${skill}"`);
      expect(markup[index]).toContain('class="skillcape-art__garment"');
      expect(markup[index]).toContain('class="skillcape-art__emblem"');
    }
  });

  it("marks trimmed capes and falls back safely for unknown skills", () => {
    const trimmed = renderToStaticMarkup(
      <SkillcapeArt skill="Strength" trimmed variant="worn" />,
    );
    const unknown = renderToStaticMarkup(
      <SkillcapeArt skill="Unknown" trimmed={false} variant="wall" />,
    );

    expect(trimmed).toContain('data-trimmed="true"');
    expect(trimmed).toContain('skillcape-art--worn');
    expect(unknown).toContain('data-skill="Unknown"');
    expect(getSkillcapePalette("Unknown").body).toBe("#6f6759");
  });
});
```

- [ ] **Step 2: Run the focused test and confirm the missing-module failure**

Run: `npm test -- src/components/SkillcapeArt.test.tsx`

Expected: FAIL because `./SkillcapeArt` does not exist.

- [ ] **Step 3: Implement the component and palettes**

Create `src/components/SkillcapeArt.tsx` with:

```tsx
import type { CSSProperties } from "react";
import type { SkillName } from "../lib/githubCharacter";
import { SKILL_COLORS, SKILL_ICONS } from "./icons";

export type SkillcapePalette = {
  body: string;
  side: string;
  mantle: string;
  trim: string;
};

const CAPE_PALETTES: Record<SkillName, SkillcapePalette> = {
  Attack: { body: "#9f281f", side: "#5a1715", mantle: "#342d29", trim: "#d6a72f" },
  Strength: { body: "#28783c", side: "#164c2a", mantle: "#273029", trim: "#d6a72f" },
  Defence: { body: "#8ba9d7", side: "#526b96", mantle: "#383d43", trim: "#d8d5c7" },
  Ranged: { body: "#667d2e", side: "#3c4d1b", mantle: "#30352a", trim: "#d6a72f" },
  Magic: { body: "#273d8c", side: "#182453", mantle: "#282c42", trim: "#d6a72f" },
  Crafting: { body: "#7b4b28", side: "#4e2d19", mantle: "#373029", trim: "#d6a72f" },
  Mining: { body: "#506779", side: "#30414f", mantle: "#30363a", trim: "#aebbc4" },
  Smithing: { body: "#3e464d", side: "#242a2e", mantle: "#292d30", trim: "#aebbc4" },
  Prayer: { body: "#e7e2cf", side: "#a7a493", mantle: "#5c5b55", trim: "#d6a72f" },
  Hitpoints: { body: "#f0eee6", side: "#b8b1a8", mantle: "#4d4642", trim: "#a72724" },
};

const FALLBACK_PALETTE: SkillcapePalette = {
  body: "#6f6759",
  side: "#403b34",
  mantle: "#302d29",
  trim: "#a89a78",
};

export function getSkillcapePalette(skill: SkillName | string): SkillcapePalette {
  return CAPE_PALETTES[skill as SkillName] ?? FALLBACK_PALETTE;
}

export function SkillcapeArt({
  skill,
  trimmed,
  variant,
  className = "",
}: {
  skill: SkillName | string;
  trimmed: boolean;
  variant: "wall" | "worn";
  className?: string;
}) {
  const palette = getSkillcapePalette(skill);
  const SkillIcon = SKILL_ICONS[skill as SkillName];
  const style = {
    "--cape-body": palette.body,
    "--cape-side": palette.side,
    "--cape-mantle": palette.mantle,
    "--cape-trim": trimmed ? palette.trim : SKILL_COLORS[skill as SkillName] ?? palette.trim,
  } as CSSProperties;

  return (
    <span
      className={`skillcape-art skillcape-art--${variant} ${className}`.trim()}
      data-skill={skill}
      data-trimmed={trimmed || undefined}
      style={style}
      aria-hidden="true"
    >
      <svg className="skillcape-art__garment" viewBox="0 0 96 142" focusable="false">
        <path className="skillcape-art__horn" d="M32 20 13 5 7 9l20 25z" />
        <path className="skillcape-art__horn" d="m64 20 19-15 6 4-20 25z" />
        <path className="skillcape-art__body" d="M28 22h40l13 109-14 7-19-5-19 5-14-7z" />
        <path className="skillcape-art__side" d="M28 22 15 131l14 7 10-105zM68 22l13 109-14 7L57 33z" />
        <path className="skillcape-art__mantle" d="M25 18q23 18 46 0l-5 25q-18-10-36 0z" />
        <path className="skillcape-art__neck" d="M39 19q9 9 18 0l-3 12H42z" />
        <path className="skillcape-art__trim" d="M28 22 15 131l14 7M68 22l13 109-14 7" />
      </svg>
      <span className="skillcape-art__emblem">{SkillIcon ? <SkillIcon /> : "◆"}</span>
    </span>
  );
}
```

- [ ] **Step 4: Run the focused test**

Run: `npm test -- src/components/SkillcapeArt.test.tsx`

Expected: PASS, 2 tests.

- [ ] **Step 5: Commit the artwork unit**

```bash
git add src/components/SkillcapeArt.tsx src/components/SkillcapeArt.test.tsx
git commit -m "feat: add illustrated skillcape artwork"
```

### Task 2: Use illustrated capes in both display contexts

**Files:**
- Modify: `src/components/TrophyWall.tsx`
- Modify: `src/components/TrophyWall.test.tsx`
- Modify: `src/components/Viewport.tsx`
- Modify: `src/components/Viewport.test.tsx`

**Interfaces:**
- Consumes: `SkillcapeArt` from Task 1 and existing `WallDisplay.skill`, `WallDisplay.trimmed`, and `Prestige.capeSkill` values.
- Produces: wall and worn cape markup sharing one artwork implementation.

- [ ] **Step 1: Add failing integration assertions**

In `TrophyWall.test.tsx`, extend the first test:

```tsx
expect(markup).toContain('data-skill="Strength"');
expect(markup).toContain('data-trimmed="true"');
expect(markup).toContain('class="skillcape-art__garment"');
expect(markup).not.toContain('class="wall-display-art" aria-hidden="true"></span>');
```

In `Viewport.test.tsx`, add:

```tsx
it("uses the illustrated garment for the equipped cape", () => {
  const markup = renderToStaticMarkup(
    <Viewport sheet={fixture} say={() => undefined} />,
  );

  expect(markup).toContain('skillcape-art--worn');
  expect(markup).toContain('data-skill="Strength"');
  expect(markup.match(/skillcape-art__garment/g)).toHaveLength(1);
});
```

- [ ] **Step 2: Run the integration tests and confirm failure**

Run: `npm test -- src/components/TrophyWall.test.tsx src/components/Viewport.test.tsx`

Expected: FAIL because neither component renders `SkillcapeArt` yet.

- [ ] **Step 3: Replace both placeholder implementations**

In `TrophyWall.tsx`, remove the `CSSProperties` and `SKILL_COLORS` imports, import `SkillcapeArt`, and replace the decorative cape span with:

```tsx
{display.kind === "cape" && display.skill ? (
  <SkillcapeArt
    skill={display.skill}
    trimmed={display.trimmed}
    variant="wall"
  />
) : (
  <span className="wall-display-art" aria-hidden="true" />
)}
```

In `Viewport.tsx`, remove the `CSSProperties` and `SKILL_COLORS` imports, import `SkillcapeArt`, and replace `.cape-trim` plus `.cape-main` with:

```tsx
<span className={prestige.trimmed ? "skillcape trimmed" : "skillcape"} aria-hidden="true">
  <SkillcapeArt
    skill={prestige.capeSkill}
    trimmed={prestige.trimmed}
    variant="worn"
  />
</span>
```

- [ ] **Step 4: Run the focused integration tests**

Run: `npm test -- src/components/TrophyWall.test.tsx src/components/Viewport.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit cape integration**

```bash
git add src/components/TrophyWall.tsx src/components/TrophyWall.test.tsx src/components/Viewport.tsx src/components/Viewport.test.tsx
git commit -m "feat: render skillcapes across the inn"
```

### Task 3: Introduce the top-down room structure

**Files:**
- Create: `src/components/InnRoom.tsx`
- Create: `src/components/InnRoom.test.tsx`
- Modify: `src/components/Viewport.tsx`
- Modify: `src/components/Viewport.test.tsx`

**Interfaces:**
- Produces: `InnRoom()`, a decorative `aria-hidden` and pointer-inert scenery tree.
- Consumes: no character or achievement data.

- [ ] **Step 1: Write failing room-structure tests**

Create `src/components/InnRoom.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InnRoom } from "./InnRoom";

describe("InnRoom", () => {
  it("renders one inert top-down room with the required composition anchors", () => {
    const markup = renderToStaticMarkup(<InnRoom />);

    expect(markup).toContain('class="inn-room"');
    expect(markup).toContain('aria-hidden="true"');
    for (const className of [
      "inn-floorboards",
      "inn-central-rug",
      "inn-wall inn-wall--north",
      "inn-wall inn-wall--west",
      "inn-wall inn-wall--east",
      "inn-table inn-table--left",
      "inn-table inn-table--right",
      "inn-counter",
      "inn-hearth",
    ]) {
      expect(markup).toContain(`class="${className}"`);
    }
  });
});
```

Update the first `Viewport.test.tsx` case to expect `inn-room`, `inn-central-rug`, and `inn-counter`, and to reject `inn-back-wall`, `inn-stonework`, and `inn-banner`.

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `npm test -- src/components/InnRoom.test.tsx src/components/Viewport.test.tsx`

Expected: FAIL because `InnRoom` does not exist and the viewport still renders front-facing layers.

- [ ] **Step 3: Create and compose the scenery component**

Create `src/components/InnRoom.tsx`:

```tsx
export function InnRoom() {
  return (
    <div className="inn-room" aria-hidden="true">
      <span className="inn-floorboards" />
      <span className="inn-central-rug"><i /></span>
      <span className="inn-wall inn-wall--north" />
      <span className="inn-wall inn-wall--west" />
      <span className="inn-wall inn-wall--east" />
      <span className="inn-table inn-table--left"><i /><b /><b /></span>
      <span className="inn-table inn-table--right"><i /><b /><b /></span>
      <span className="inn-counter"><i /><b /><b /><b /></span>
      <span className="inn-hearth"><i className="hearth-mantle" /><i className="hearth-fire" /></span>
      <span className="inn-scatter inn-scatter--left" />
      <span className="inn-scatter inn-scatter--right" />
    </div>
  );
}
```

Import `InnRoom` into `Viewport.tsx`. Replace `inn-back-wall`, `inn-floor`, and the separate hearth markup with `<InnRoom />`, leaving `TrophyWall` immediately after it.

- [ ] **Step 4: Run the focused tests**

Run: `npm test -- src/components/InnRoom.test.tsx src/components/Viewport.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit room structure**

```bash
git add src/components/InnRoom.tsx src/components/InnRoom.test.tsx src/components/Viewport.tsx src/components/Viewport.test.tsx
git commit -m "feat: compose a top-down inn room"
```

### Task 4: Style the top-down scene and display zones

**Files:**
- Modify: `src/App.css`
- Modify: `src/components/Viewport.test.tsx`
- Modify: `src/components/TrophyWall.test.tsx`

**Interfaces:**
- Consumes: class names introduced by Tasks 1 through 3.
- Produces: the desktop composition, explicit layer order, cape garment finish, and non-overlapping wall zones.

- [ ] **Step 1: Add failing CSS-contract tests**

Add this test to `Viewport.test.tsx`:

```tsx
it("defines the top-down room and foreground stacking contract", () => {
  const styles = readFileSync(new URL("../App.css", import.meta.url), "utf8");

  expect(styles).toMatch(/\.inn-room\s*\{[^}]*pointer-events:\s*none/s);
  expect(styles).toMatch(/\.inn-floorboards\s*\{[^}]*repeating-linear-gradient/s);
  expect(styles).toMatch(/\.inn-central-rug\s*\{[^}]*z-index:\s*1/s);
  expect(styles).toMatch(/\.skillcape\s*\{[^}]*z-index:\s*4/s);
  expect(styles).toMatch(/\.player-avatar\s*\{[^}]*z-index:\s*5/s);
  expect(styles).toMatch(/\.nameplate\s*\{[^}]*z-index:\s*6/s);
  expect(styles).not.toContain(".inn-back-wall");
  expect(styles).not.toContain(".wall-display.cape .wall-display-art");
});
```

Add this assertion to the cape layout test in `TrophyWall.test.tsx`:

```tsx
expect(markup).toContain('class="skillcape-art skillcape-art--wall"');
```

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `npm test -- src/components/Viewport.test.tsx src/components/TrophyWall.test.tsx`

Expected: FAIL because the old front-facing CSS and wedge cape rules remain.

- [ ] **Step 3: Replace the scene and cape CSS**

In `src/App.css`, delete the old `.inn-back-wall`, `.inn-stonework`, `.inn-beam`, `.inn-banner`, `.inn-floor`, and wedge-based `.wall-display.cape .wall-display-art` rules. Add these complete selector groups:

```css
.inn-room { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
.inn-floorboards { position: absolute; inset: 0; background: repeating-linear-gradient(0deg, #24170f 0 20px, #39261a 21px 23px, #1b110b 24px 25px), repeating-linear-gradient(90deg, transparent 0 92px, rgba(0,0,0,.35) 93px 96px); }
.inn-floorboards::after { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 48%, transparent 0 35%, rgba(8,4,2,.42) 100%); }
.inn-central-rug { position: absolute; z-index: 1; top: 10%; bottom: 8%; left: 50%; width: clamp(170px, 25%, 230px); border: 7px solid #c39a25; background: #8f171d; box-shadow: inset 0 0 0 5px #531014, 0 8px 12px rgba(0,0,0,.55); transform: translateX(-50%); }
.inn-central-rug i { position: absolute; top: 54%; left: 50%; width: 58px; height: 58px; background: #25130f; clip-path: polygon(50% 0, 62% 36%, 100% 50%, 62% 64%, 50% 100%, 38% 64%, 0 50%, 38% 36%); transform: translate(-50%, -50%); }
.inn-wall { position: absolute; z-index: 2; background: #7a5a38; box-shadow: inset 0 -8px #382215, 0 5px 10px rgba(0,0,0,.55); }
.inn-wall--north { top: 0; right: 0; left: 0; height: 42px; }
.inn-wall--west { top: 0; bottom: 0; left: 0; width: 34px; }
.inn-wall--east { top: 0; right: 0; bottom: 0; width: 34px; }
.inn-table { position: absolute; z-index: 3; top: 28%; width: 22%; height: 21%; border: 4px solid #2b190f; background: repeating-linear-gradient(90deg, #5a3821 0 28px, #3b2417 29px 32px); box-shadow: 8px 10px 0 rgba(0,0,0,.34); }
.inn-table--left { left: 7%; }
.inn-table--right { right: 7%; }
.inn-table i { position: absolute; right: 10%; bottom: -38px; left: 10%; height: 26px; background: #392116; box-shadow: 0 7px 0 #1d100a; }
.inn-table b { position: absolute; bottom: -54px; width: 24px; height: 24px; border-radius: 50%; background: #6b3025; box-shadow: inset 0 0 0 4px #351711; }
.inn-table b:nth-of-type(1) { left: 8%; }
.inn-table b:nth-of-type(2) { right: 8%; }
.inn-counter { position: absolute; z-index: 3; right: 8%; bottom: 4%; left: 8%; height: 72px; border: 5px solid #28170e; background: repeating-linear-gradient(90deg, #5c3a24 0 58px, #3c2517 59px 62px); box-shadow: 0 -8px 0 #795239; }
.inn-hearth { position: absolute; right: 4%; bottom: 24%; z-index: 3; width: 84px; height: 112px; border: 4px solid #241b16; background: #625249; }
.inn-scatter { position: absolute; z-index: 2; width: 8px; height: 8px; background: #d0a533; clip-path: polygon(50% 0, 100% 45%, 58% 100%, 0 62%); }
.inn-scatter--left { left: 34%; bottom: 18%; }
.inn-scatter--right { right: 30%; top: 23%; }

.skillcape-art { position: relative; display: block; color: #e4ddc5; }
.skillcape-art__garment { display: block; width: 100%; height: 100%; overflow: visible; filter: drop-shadow(3px 5px 2px rgba(0,0,0,.65)); }
.skillcape-art__horn { fill: #1f1b18; stroke: #0b0908; stroke-width: 2; }
.skillcape-art__body { fill: var(--cape-body); stroke: var(--cape-trim); stroke-width: 3; }
.skillcape-art__side { fill: var(--cape-side); }
.skillcape-art__mantle { fill: var(--cape-mantle); stroke: var(--cape-trim); stroke-width: 2; }
.skillcape-art__neck { fill: #171411; }
.skillcape-art__trim { fill: none; stroke: var(--cape-trim); stroke-width: 3; }
.skillcape-art__emblem { position: absolute; top: 43%; left: 50%; display: grid; place-items: center; width: 34%; height: 34%; color: #ded5bc; filter: drop-shadow(1px 2px 0 #18120d); transform: translate(-50%, -50%); }
.skillcape-art__emblem svg { width: 100%; height: 100%; stroke-width: 2.2; }
.skillcape-art--wall { width: 58px; height: 86px; }
.skillcape-art--worn { width: 100%; height: 100%; }
```

Replace the existing trophy-wall layout and worn-cape geometry with these rules:

```css
.trophy-wall { position: absolute; inset: 52px 42px 86px; z-index: 3; pointer-events: none; }
.wall-zone { position: absolute; min-width: 0; pointer-events: none; }
.wall-zone.cape-hooks { top: 0; right: 29%; left: 29%; }
.wall-zone.upper-wall { top: 17%; right: 4%; width: 22%; }
.wall-zone.trophy-shelf { top: 17%; left: 4%; width: 22%; }
.wall-display-list { display: flex; flex-wrap: wrap; justify-content: center; gap: 15px 18px; margin: 0; padding: 18px 12px; list-style: none; }
.wall-display-item { position: relative; pointer-events: auto; }
.wall-display { position: relative; width: 58px; min-height: 86px; padding: 0; border: 0; background: transparent; color: #fff5d6; cursor: help; }
.wall-zone.cape-hooks::before { content: ""; position: absolute; top: 7px; right: 3px; left: 3px; height: 9px; background: #654126; box-shadow: 0 4px 0 #2b180e; }
.wall-zone.trophy-shelf::after { content: ""; position: absolute; right: 0; bottom: 2px; left: 0; height: 12px; background: #654126; box-shadow: 0 4px 0 #2b180e; }
.wall-display-tooltip { z-index: 60; }

.skillcape { position: absolute; inset: -8% -14% -15%; z-index: 4; transform: scale(1.12); transform-origin: 50% 18%; }
.player-avatar { position: relative; z-index: 5; }
.overhead-text { position: relative; z-index: 6; }
.nameplate { position: relative; z-index: 6; }
.class-line { position: relative; z-index: 6; }
.context-menu { z-index: 70; }
```

Keep the existing tooltip typography, trophy-material colors, focus outline, portrait sizing, and context-menu appearance unless a later acceptance test exposes a conflict.

- [ ] **Step 4: Run focused tests and the production build**

Run: `npm test -- src/components/Viewport.test.tsx src/components/TrophyWall.test.tsx src/components/SkillcapeArt.test.tsx src/components/InnRoom.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: TypeScript and Vite production build complete without errors.

- [ ] **Step 5: Commit the visual composition**

```bash
git add src/App.css src/components/Viewport.test.tsx src/components/TrophyWall.test.tsx
git commit -m "feat: style the top-down OSRS inn"
```

### Task 5: Desktop acceptance, regression fixes, and release readiness

**Files:**
- Modify if required by observed defects: `src/App.css`
- Modify if required by observed defects: `src/components/SkillcapeArt.tsx`
- Modify if required by observed defects: `src/components/TrophyWall.tsx`
- Modify if required by observed defects: `src/components/Viewport.tsx`
- Test alongside any fix: the corresponding `*.test.tsx` file

**Interfaces:**
- Consumes: complete top-down scene from Tasks 1 through 4.
- Produces: browser-verified desktop behavior and a clean, releasable branch.

- [ ] **Step 1: Run the full automated suite**

Run: `npm test`

Expected: all test files and tests pass.

Run: `npm run build`

Expected: TypeScript and Vite production build pass.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 2: Start the production preview**

Run: `npm run preview -- --port 4173`

Expected: Vite serves the built site at `http://127.0.0.1:4173/`.

- [ ] **Step 3: Perform real-browser acceptance at 1440 by 1000**

Navigate to `http://127.0.0.1:4173/character/torvalds` in installed Chrome and verify all of the following:

```text
The scene reads as a top-down timber inn rather than a front-facing wall.
The GitHub portrait remains large, centered, and legible over the red-and-gold rug.
Tables, stools, wall edges, counter, and hearth frame the central route without crossing it.
Every earned cape is a garment with shoulders, neck opening, folds, trim, and a skill emblem.
The worn cape stays behind the portrait and never covers the nameplate.
Every earned cape and trophy is visible exactly once.
Hover and keyboard focus reveal each display tooltip.
The portrait click menu opens and remains above the room.
There is no horizontal overflow and no overlap between interactive displays.
The console has no errors, page exceptions, or failed application requests.
```

Capture a 1440 by 1000 screenshot as an untracked local acceptance artifact.

- [ ] **Step 4: Fix only acceptance defects with a failing regression test first**

For each observed defect, add a focused failing assertion to the owning test file, run it to confirm failure, make the smallest CSS or component correction, and rerun that focused test. Do not broaden scope into mobile or sidebar work.

- [ ] **Step 5: Re-run all release gates**

Run: `npm test && npm run build && git diff --check`

Expected: all commands pass and `git status --short` shows only intentional tracked changes, if any.

- [ ] **Step 6: Commit acceptance corrections if any exist**

```bash
git add src/App.css src/components/SkillcapeArt.tsx src/components/SkillcapeArt.test.tsx src/components/TrophyWall.tsx src/components/TrophyWall.test.tsx src/components/Viewport.tsx src/components/Viewport.test.tsx
git commit -m "fix: harden top-down inn acceptance"
```

If no acceptance correction was required, do not create an empty commit.

- [ ] **Step 7: Prepare the verified branch for review and deployment**

Run: `git log --oneline origin/main..HEAD`

Expected: the design, implementation plan, cape artwork, cape integration, room structure, scene styling, and any acceptance correction commits appear in order.

Run: `git status --short --branch`

Expected: clean working tree on `agent/top-down-inn`.
