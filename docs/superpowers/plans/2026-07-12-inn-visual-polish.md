# Inn Component and Character Text Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace blocky inn furniture with coherent top-down SVG components and give character text a collision-free, deliberately framed layout.

**Architecture:** `InnRoom` remains a single decorative accessibility boundary but delegates wall, table, counter, and hearth artwork to focused inline-SVG helpers. `Viewport` changes only presentation order: overhead plaque, portrait, grouped caption, and in-flow status row; achievement and character data remain untouched.

**Tech Stack:** React 19, TypeScript 5.8, inline SVG, CSS, Vitest, Vite 7, installed Chrome

## Global Constraints

- Preserve the 520px desktop scene, 180px portrait, current data model, equipment, trophies, Skillcapes, tabs, and chatbox.
- Support 1440x1000 and the 941x1000 desktop boundary; mobile remains deferred.
- Add no raster background, canvas renderer, generated asset, or dependency.
- All room art remains decorative, `aria-hidden`, and pointer-inert.
- Achievement buttons, portrait menu, nameplate link, hover/focus tooltips, and accessible labels remain interactive.
- Empty cape groups render no rail; populated left and right groups render separate short rails.
- No room shape, rail, or text block may intersect overhead, identity, or status text.

---

## File Structure

- Modify `src/components/InnRoom.tsx`: focused SVG helpers for wall frame, tables and benches, counter, and hearth.
- Modify `src/components/InnRoom.test.tsx`: structural and decorative-boundary tests for each illustrated component.
- Modify `src/components/Viewport.tsx`: explicit overhead/portrait/caption/status DOM order.
- Modify `src/components/Viewport.test.tsx`: character-stack order and CSS collision-contract tests.
- Modify `src/components/TrophyWall.test.tsx`: populated and empty cape-rail hook tests.
- Modify `src/App.css`: shared material palette, furniture rendering, floor detail, split rails, plaque/caption/status layout, and narrow-desktop scaling.

### Task 1: Illustrated inn furniture

**Files:**
- Modify: `src/components/InnRoom.tsx`
- Modify: `src/components/InnRoom.test.tsx`
- Modify: `src/App.css`

**Interfaces:**
- Produces: `InnWallFrame()`, `InnTable({ side })`, `InnCounter()`, and `InnHearth()` as private decorative helpers composed by `InnRoom()`.
- Preserves: exported `InnRoom()` with a single `aria-hidden="true"` root.

- [ ] **Step 1: Write failing furniture tests**

Replace `src/components/InnRoom.test.tsx` with:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InnRoom } from "./InnRoom";

describe("InnRoom", () => {
  it("renders one inert room with focused illustrated furniture", () => {
    const markup = renderToStaticMarkup(<InnRoom />);

    expect(markup).toContain('class="inn-room"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('class="inn-wall-frame"');
    expect(markup.match(/class="inn-furniture inn-table inn-table--/g)).toHaveLength(2);
    expect(markup).toContain('class="inn-furniture inn-counter"');
    expect(markup).toContain('class="inn-furniture inn-hearth"');
    expect(markup).not.toContain("aria-label=");
    expect(markup).not.toContain("tabindex=");
  });

  it("gives tables top planes, planks, legs, benches, and shadows", () => {
    const markup = renderToStaticMarkup(<InnRoom />);

    expect(markup.match(/class="inn-table-top"/g)).toHaveLength(2);
    expect(markup.match(/class="inn-table-bevel"/g)).toHaveLength(2);
    expect(markup.match(/class="inn-table-planks"/g)).toHaveLength(2);
    expect(markup.match(/class="inn-table-legs"/g)).toHaveLength(2);
    expect(markup.match(/class="inn-bench"/g)).toHaveLength(2);
    expect(markup.match(/class="inn-contact-shadow"/g)).toHaveLength(4);
  });

  it("builds the hearth from masonry, an arched firebox, logs, and layered flame", () => {
    const markup = renderToStaticMarkup(<InnRoom />);

    expect(markup).toContain('class="inn-hearth-stones"');
    expect(markup).toContain('class="inn-firebox"');
    expect(markup).toContain('class="inn-fire-logs"');
    expect(markup).toContain('class="inn-flame inn-flame--outer"');
    expect(markup).toContain('class="inn-flame inn-flame--inner"');
    expect(markup).toContain('class="inn-hearth-mantle"');
  });
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npm test -- src/components/InnRoom.test.tsx`

Expected: FAIL because the existing room uses anonymous spans and has none of the illustrated component classes.

- [ ] **Step 3: Implement the illustrated component structure**

Replace `src/components/InnRoom.tsx` with:

```tsx
export function InnRoom() {
  return (
    <div className="inn-room" aria-hidden="true">
      <span className="inn-floorboards">
        <i className="floor-knot floor-knot--one" />
        <i className="floor-knot floor-knot--two" />
        <i className="floor-nails floor-nails--one" />
        <i className="floor-nails floor-nails--two" />
      </span>
      <span className="inn-central-rug"><i /></span>
      <InnWallFrame />
      <InnTable side="left" />
      <InnTable side="right" />
      <InnCounter />
      <InnHearth />
      <span className="inn-room-detail inn-room-detail--mug" />
      <span className="inn-room-detail inn-room-detail--coins" />
    </div>
  );
}

function InnWallFrame() {
  return (
    <svg className="inn-wall-frame" viewBox="0 0 1000 520" preserveAspectRatio="none" focusable="false">
      <path className="inn-wall-plaster" d="M0 0h1000v48H0z" />
      <path className="inn-wall-timber" d="M0 0h1000v22H0zM0 0h38v520H0zM962 0h38v520h-38z" />
      <path className="inn-wall-highlight" d="M8 7h984M8 7v505M970 7v505" />
      <path className="inn-wall-joints" d="M205 0v22M500 0v22M795 0v22M0 132h38M962 132h38M0 344h38M962 344h38" />
      <g className="inn-wall-pegs">
        <circle cx="205" cy="12" r="5" /><circle cx="500" cy="12" r="5" /><circle cx="795" cy="12" r="5" />
      </g>
    </svg>
  );
}

function InnTable({ side }: { side: "left" | "right" }) {
  return (
    <svg className={`inn-furniture inn-table inn-table--${side}`} viewBox="0 0 240 170" focusable="false">
      <ellipse className="inn-contact-shadow" cx="126" cy="145" rx="104" ry="16" />
      <g className="inn-table-legs">
        <rect x="31" y="92" width="18" height="29" /><rect x="191" y="92" width="18" height="29" />
      </g>
      <path className="inn-table-top" d="M18 22h204l-11 88H29z" />
      <path className="inn-table-bevel" d="M18 22h204l-4 13H22zM29 110h182l-5 9H34z" />
      <path className="inn-table-planks" d="M63 26l-6 80M108 26l-2 80M153 26l2 80M198 26l6 80" />
      <path className="inn-wood-knot" d="M82 66q10-9 20 0-10 10-20 0z" />
      <g className="inn-bench">
        <path d="M43 128h154l8 19H35z" />
        <rect x="50" y="146" width="14" height="12" /><rect x="176" y="146" width="14" height="12" />
        <path className="inn-bench-highlight" d="M46 132h148" />
      </g>
    </svg>
  );
}

function InnCounter() {
  return (
    <svg className="inn-furniture inn-counter" viewBox="0 0 420 120" focusable="false">
      <path className="inn-contact-shadow" d="M18 100h384l-16 14H34z" />
      <path className="inn-counter-front" d="M24 34h372v68H24z" />
      <path className="inn-counter-top" d="M10 18h400l-14 28H24z" />
      <path className="inn-counter-highlight" d="M18 23h384" />
      <path className="inn-counter-panels" d="M34 52v42M105 52v42M176 52v42M247 52v42M318 52v42M386 52v42" />
      <path className="inn-counter-posts" d="M24 40h14v62H24zM382 40h14v62h-14z" />
    </svg>
  );
}

function InnHearth() {
  return (
    <svg className="inn-furniture inn-hearth" viewBox="0 0 120 150" focusable="false">
      <ellipse className="inn-contact-shadow" cx="63" cy="137" rx="52" ry="10" />
      <g className="inn-hearth-stones">
        <path d="M12 28h96v108H12z" />
        <path d="M17 34h26v22H17zM46 34h29v22H46zM78 34h25v22H78z" />
        <path d="M17 59h22v27H17zM82 59h21v27H82zM17 89h22v38H17zM82 89h21v38H82z" />
      </g>
      <path className="inn-hearth-mantle" d="M5 18h110v19H5z" />
      <path className="inn-hearth-mantle-highlight" d="M10 22h100" />
      <path className="inn-firebox" d="M39 128V79q21-35 42 0v49z" />
      <g className="inn-fire-logs"><path d="m43 120 34-13M45 107l31 14" /></g>
      <path className="inn-flame inn-flame--outer" d="M60 116q-20-18 1-47 21 28-1 47z" />
      <path className="inn-flame inn-flame--inner" d="M60 112q-9-10 1-27 10 16-1 27z" />
    </svg>
  );
}
```

- [ ] **Step 4: Replace old furniture CSS with the shared material system**

In `src/App.css`, replace the existing block from `.inn-room` through `.inn-scatter--right` with the exact selector set below:

```css
.inn-room { --wood-hi:#9b6840; --wood:#664022; --wood-lo:#352014; --outline:#21130c; --stone-hi:#8b7968; --stone:#625348; --stone-lo:#302923; position:absolute; inset:0; z-index:0; overflow:hidden; pointer-events:none; }
.inn-floorboards { position:absolute; inset:0; background:repeating-linear-gradient(0deg, transparent 0 21px, rgba(12,7,4,.72) 22px 24px), repeating-linear-gradient(90deg, #2b1a10 0 77px, #3b2416 78px 153px, #25160e 154px 158px); }
.inn-floorboards::before { content:""; position:absolute; inset:24px 0 0; background:repeating-linear-gradient(90deg, transparent 0 38px, rgba(8,4,2,.34) 39px 41px, transparent 42px 118px); opacity:.7; }
.inn-floorboards::after { content:""; position:absolute; inset:0; background:radial-gradient(ellipse at 50% 48%, transparent 0 32%, rgba(8,4,2,.48) 100%); }
.floor-knot,.floor-nails { position:absolute; z-index:1; display:block; }
.floor-knot { width:18px; height:8px; border:2px solid #1a0f09; border-radius:50%; box-shadow:inset 0 0 0 2px #4d2c18; }
.floor-knot--one { top:32%; left:17%; transform:rotate(-8deg); }
.floor-knot--two { right:20%; bottom:24%; transform:rotate(12deg); }
.floor-nails { width:4px; height:4px; border-radius:50%; background:#17100c; box-shadow:20px 0 #17100c; }
.floor-nails--one { top:19%; left:31%; }.floor-nails--two { right:34%; bottom:17%; }
.inn-central-rug { position:absolute; z-index:1; top:9%; bottom:7%; left:50%; width:clamp(170px,25%,230px); border:7px solid #c79b28; background:repeating-linear-gradient(90deg,rgba(255,255,255,.04) 0 3px,transparent 4px 9px),#8f171d; box-shadow:inset 0 0 0 4px #561014,inset 0 0 0 7px #b67f24,7px 10px 0 rgba(0,0,0,.34); transform:translateX(-50%); }
.inn-central-rug i { position:absolute; top:54%; left:50%; width:58px; height:58px; border:3px solid #c79b28; background:#3a1414; clip-path:polygon(50% 0,62% 36%,100% 50%,62% 64%,50% 100%,38% 64%,0 50%,38% 36%); transform:translate(-50%,-50%); }
.inn-wall-frame { position:absolute; inset:0; z-index:2; width:100%; height:100%; overflow:visible; filter:drop-shadow(5px 6px 0 rgba(0,0,0,.34)); }
.inn-wall-plaster { fill:#786144; }.inn-wall-timber { fill:var(--wood); stroke:var(--outline); stroke-width:5; vector-effect:non-scaling-stroke; }.inn-wall-highlight { fill:none; stroke:var(--wood-hi); stroke-width:4; opacity:.75; vector-effect:non-scaling-stroke; }.inn-wall-joints { fill:none; stroke:var(--wood-lo); stroke-width:5; vector-effect:non-scaling-stroke; }.inn-wall-pegs { fill:#29231d; stroke:#aa8e63; stroke-width:2; }
.inn-furniture { position:absolute; z-index:3; overflow:visible; filter:drop-shadow(2px 3px 0 rgba(0,0,0,.38)); }
.inn-contact-shadow { fill:rgba(8,4,2,.48); }.inn-table { bottom:18%; width:22%; height:31%; }.inn-table--left { left:15.5%; }.inn-table--right { right:15.5%; }
.inn-table-legs { fill:var(--wood-lo); stroke:var(--outline); stroke-width:3; }.inn-table-top { fill:var(--wood); stroke:var(--outline); stroke-width:5; stroke-linejoin:round; }.inn-table-bevel { fill:var(--wood-hi); opacity:.72; }.inn-table-planks { fill:none; stroke:#3f2516; stroke-width:3; }.inn-wood-knot { fill:#2b190f; stroke:#8a5832; stroke-width:2; }.inn-bench { fill:#58351f; stroke:var(--outline); stroke-width:3; stroke-linejoin:round; }.inn-bench-highlight { fill:none; stroke:#9a6038; stroke-width:3; }
.inn-counter { right:29%; bottom:2%; left:29%; width:42%; height:19%; }.inn-counter-front { fill:#53321e; stroke:var(--outline); stroke-width:5; }.inn-counter-top { fill:#7b4d2d; stroke:var(--outline); stroke-width:5; stroke-linejoin:round; }.inn-counter-highlight { fill:none; stroke:#ae7447; stroke-width:4; }.inn-counter-panels { fill:none; stroke:#2f1c12; stroke-width:4; }.inn-counter-posts { fill:#382116; }
.inn-hearth { right:2%; bottom:20%; width:112px; height:150px; pointer-events:none; }.inn-hearth-stones>path:first-child { fill:var(--stone-lo); stroke:var(--outline); stroke-width:5; }.inn-hearth-stones>path:not(:first-child) { fill:var(--stone); stroke:#40362f; stroke-width:3; }.inn-hearth-mantle { fill:#5d371f; stroke:var(--outline); stroke-width:5; }.inn-hearth-mantle-highlight { fill:none; stroke:#a56d42; stroke-width:4; }.inn-firebox { fill:#160d09; stroke:#2a1b14; stroke-width:5; }.inn-fire-logs { fill:none; stroke:#5f2917; stroke-width:6; stroke-linecap:round; }.inn-flame--outer { fill:#e65419; filter:drop-shadow(0 0 7px rgba(255,116,31,.7)); }.inn-flame--inner { fill:#ffe36d; }
.inn-room-detail { position:absolute; z-index:3; display:block; }.inn-room-detail--mug { top:31%; left:14%; width:13px; height:15px; border:3px solid #bda274; border-radius:2px 2px 5px 5px; box-shadow:7px 2px 0 -3px #bda274; transform:rotate(-8deg); }.inn-room-detail--coins { top:25%; right:17%; width:7px; height:7px; border-radius:50%; background:#d3a72b; box-shadow:9px 4px #a8791c,17px -2px #c89523; }
```

- [ ] **Step 5: Run furniture tests and full build**

Run: `npm test -- src/components/InnRoom.test.tsx && npm run build`

Expected: 3 furniture tests pass and production build succeeds.

- [ ] **Step 6: Commit the furniture slice**

```bash
git add src/components/InnRoom.tsx src/components/InnRoom.test.tsx src/App.css
git commit -m "feat: illustrate the inn furniture"
```

### Task 2: Character text stack, split rails, and acceptance

**Files:**
- Modify: `src/components/Viewport.tsx`
- Modify: `src/components/Viewport.test.tsx`
- Modify: `src/components/TrophyWall.test.tsx`
- Modify: `src/App.css`

**Interfaces:**
- Consumes: existing `sheet`, status orb values, cape groups, portrait menu, and accessible labels.
- Produces: `.character-caption` wrapping `.nameplate` and `.class-line`; in-flow `.status-orbs`; separate populated `.cape-hook-group::before` rails.

- [ ] **Step 1: Write failing character-stack tests**

Add to `Viewport.test.tsx`:

```tsx
it("orders character text and status into one collision-free stack", () => {
  const markup = renderToStaticMarkup(<Viewport sheet={fixture} say={() => undefined} />);
  const overhead = markup.indexOf('class="overhead-text"');
  const portrait = markup.indexOf('class="player-hitbox"');
  const caption = markup.indexOf('class="character-caption"');
  const status = markup.indexOf('class="status-orbs"');

  expect(overhead).toBeGreaterThan(-1);
  expect(overhead).toBeLessThan(portrait);
  expect(portrait).toBeLessThan(caption);
  expect(caption).toBeLessThan(status);
  expect(markup).toContain('<div class="character-caption"><p class="nameplate">');
  expect(markup).toContain('</p><p class="class-line">Master Code Warrior</p></div>');
});

it("frames character copy and keeps status orbs in flow", () => {
  const styles = readFileSync(new URL("../App.css", import.meta.url), "utf8");

  expect(styles).toMatch(/\.overhead-text\s*\{[^}]*padding:[^}]*background:[^}]*line-height:/s);
  expect(styles).toMatch(/\.character-caption\s*\{[^}]*padding:[^}]*background:[^}]*border:/s);
  expect(styles).toMatch(/\.nameplate\s*\{[^}]*margin:\s*0[^}]*line-height:/s);
  expect(styles).toMatch(/\.class-line\s*\{[^}]*margin:\s*0[^}]*line-height:/s);
  expect(styles).toMatch(/\.status-orbs\s*\{[^}]*position:\s*relative[^}]*transform:\s*none/s);
  expect(styles).not.toMatch(/\.status-orbs\s*\{[^}]*bottom:\s*112px/s);
});
```

In the existing `reserves a portrait-safe desktop lane for the maximum display set` test, replace the obsolete assertion that requires `bottom: 112px` on `.status-orbs` with:

```tsx
expect(styles).toMatch(/\.status-orbs\s*\{[^}]*position:\s*relative[^}]*display:\s*flex[^}]*transform:\s*none/s);
```

- [ ] **Step 2: Write failing split-rail tests**

Add to `TrophyWall.test.tsx`:

```tsx
it("uses separate populated cape rails and leaves empty groups bare", () => {
  const styles = readFileSync(new URL("../App.css", import.meta.url), "utf8");

  expect(styles).toMatch(/\.cape-hook-group\s*\{[^}]*position:\s*relative/s);
  expect(styles).toMatch(/\.cape-hook-group::before\s*\{[^}]*background:[^}]*box-shadow:/s);
  expect(styles).toMatch(/\.cape-hook-group\[data-display-count="0"\]::before\s*\{[^}]*display:\s*none/s);
  expect(styles).not.toContain(".wall-zone.cape-hooks::before");
});
```

Add this import at the top of `TrophyWall.test.tsx`:

```tsx
// @ts-expect-error The app intentionally omits Node typings; Vitest supplies this at runtime.
import { readFileSync } from "node:fs";
```

- [ ] **Step 3: Run focused tests and confirm RED**

Run: `npm test -- src/components/Viewport.test.tsx src/components/TrophyWall.test.tsx`

Expected: FAIL because caption wrapper, in-flow status, plaque styles, and split rails do not exist.

- [ ] **Step 4: Reorder the Viewport character stack**

In `Viewport.tsx`, move the existing `.status-orbs` JSX inside `.player` after a new caption wrapper. Keep its orb children unchanged. Replace the standalone nameplate and class paragraphs with:

```tsx
<div className="character-caption">
  <p className="nameplate">
    {prestige.tier >= 2 ? (
      <span
        className={prestige.tier >= 3 ? "prestige-crown gold" : "prestige-crown silver"}
        title={`${prestige.title} of the realm`}
        aria-label={`${prestige.title} of the realm`}
      >
        <CrownIcon />
      </span>
    ) : null}
    <a href={sheet.user.html_url} target="_blank" rel="noreferrer">{displayName}</a>{" "}
    <span className="nameplate-level">(level-{sheet.combatLevel})</span>
  </p>
  <p className="class-line">
    {prestige.title ? `${prestige.title} ` : ""}{sheet.characterClass}
  </p>
</div>
```

The final child of `.player` is the unchanged `.status-orbs` block.

- [ ] **Step 5: Replace text and rail CSS**

Replace the existing `.status-orbs`, `.player`, `.overhead-text`, `.nameplate`, and `.class-line` rules and the cape-zone rail pseudo-element with:

```css
.status-orbs { position:relative; inset:auto; z-index:6; display:flex; gap:8px; align-items:center; justify-self:center; transform:none; }
.player { position:relative; z-index:10; display:grid; grid-template-rows:auto auto auto auto; gap:6px; justify-items:center; padding:18px 1rem 1rem; pointer-events:none; }
.overhead-text { position:relative; z-index:6; max-width:min(38ch,calc(100% - 32px)); margin:0; padding:6px 14px 7px; border:2px solid #26170f; background:linear-gradient(180deg,#4e321f,#321f15); color:var(--hud-yellow); font-size:.98rem; line-height:1.25; text-align:center; text-shadow:1px 1px 0 #000; box-shadow:inset 0 0 0 2px #795034,4px 5px 0 rgba(0,0,0,.36); }
.character-caption { position:relative; z-index:6; display:grid; gap:2px; justify-items:center; min-width:250px; max-width:min(380px,calc(100% - 32px)); padding:6px 14px 7px; background:rgba(35,20,14,.92); border:2px solid #26170f; box-shadow:inset 0 0 0 1px #805433,3px 4px 0 rgba(0,0,0,.32); }
.nameplate { position:relative; z-index:6; margin:0; color:var(--hud-white); font-size:1.15rem; font-weight:700; line-height:1.2; text-align:center; text-shadow:1px 1px 0 #000; }
.class-line { position:relative; z-index:6; margin:0; color:var(--hud-orange); font-size:.94rem; line-height:1.25; text-align:center; text-shadow:1px 1px 0 #000; }
.cape-hook-group { position:relative; flex-wrap:nowrap; gap:8px; padding:12px 0; }
.cape-hook-group::before { content:""; position:absolute; top:7px; right:0; left:0; height:9px; border:2px solid #2a170d; background:#6f4528; box-shadow:inset 0 2px 0 #a06c43,0 4px 0 #1f110a; }
.cape-hook-group[data-display-count="0"]::before { display:none; }
.wall-display-item { position:relative; z-index:1; pointer-events:auto; }
```

Delete `.wall-zone.cape-hooks::before`. Preserve the existing left/right group alignment, display sizes, tooltip positioning, orb styling, link styling, and responsive cape rules.

Add these furniture adjustments inside the existing `@media (min-width: 941px) and (max-width: 1120px)` block:

```css
.inn-table { bottom:18%; width:17%; height:28%; }
.inn-table--left { left:18%; }
.inn-table--right { right:18%; }
.inn-hearth { right:1%; bottom:23%; width:88px; height:120px; }
.inn-counter { right:32%; left:32%; width:36%; }
.character-caption { min-width:220px; max-width:300px; }
.overhead-text { max-width:32ch; }
```

- [ ] **Step 6: Run focused tests and full automated gates**

Run: `npm test -- src/components/Viewport.test.tsx src/components/TrophyWall.test.tsx src/components/InnRoom.test.tsx`

Expected: all focused tests pass.

Run: `npm test && npm run build && git diff --check`

Expected: all tests, TypeScript/Vite build, and whitespace validation pass.

- [ ] **Step 7: Run real-Chrome visual acceptance**

Serve the production build and inspect `/character/Conalh` and `/character/torvalds` at both 1440x1000 and 941x1000. Verify:

```text
The hearth reads as masonry with an arched contained fire, logs, mantle, and layered flame.
Both tables show top planes, plank divisions, legs, rectangular benches, and contact shadows.
The foreground counter has a top slab, fascia, panels, posts, and shadow.
Conalh has no empty center cape rail; Torvalds has separate occupied left/right rails.
Overhead text stays inside its plaque and intersects no rail, beam, trophy, portrait, or caption.
Name/level and class remain inside one caption and do not intersect each other or the orbs.
Status orbs follow the caption in normal flow.
Portrait menu and all visible achievement hover/focus tooltips still work.
All room and text boxes remain inside the viewport with no document horizontal overflow.
Console warnings/errors, page errors, failed requests, and non-success app/GitHub responses are empty.
```

Capture one screenshot per user and viewport size under ignored `.superpowers/sdd/` paths and visually inspect all four.

- [ ] **Step 8: Fix browser defects with RED/GREEN regression coverage**

For every observed defect, add the narrowest failing assertion to the owning component test, confirm RED, implement the smallest correction, and rerun the focused test and affected browser case. Do not expand into mobile, tabs, data, trophy artwork, or Skillcape artwork.

- [ ] **Step 9: Commit the verified text and rail slice**

```bash
git add src/App.css src/components/Viewport.tsx src/components/Viewport.test.tsx src/components/TrophyWall.test.tsx
git commit -m "fix: frame inn character text and cape rails"
```
