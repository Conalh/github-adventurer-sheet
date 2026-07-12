# Inn Trophy Room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the outdoor desktop scene with a cozy guild inn whose accessible wall displays show every earned Skillcape and five honest GitHub-derived trophies.

**Architecture:** Add a pure `trophyRoom` domain module that derives typed wall displays from the normalized character inputs already in memory, then attach its output to `CharacterSheet`. Render those records through a focused `TrophyWall` component inside a layered CSS inn; keep tooltip behavior native and accessible through focusable buttons and CSS hover/focus rules.

**Tech Stack:** React 19, TypeScript 5.8, CSS, Vitest 3, `react-dom/server`, Vite 7, real-Chrome desktop acceptance.

## Global Constraints

- This pass is desktop-only; do not add mobile layout rules or mobile acceptance work.
- Add no GitHub API requests, dependencies, remote assets, canvas rendering, locked displays, achievement browser, or cape-selection UI.
- Render only earned displays; omit a trophy when its metric cannot be established.
- Show every level-99 Skillcape on its own hook; the strongest mastered skill remains worn and is gold-trimmed when multiple masteries exist.
- Use exactly one current-material trophy per category: bronze, silver, gold, runite, or legendary.
- Keep every display keyboard-focusable and expose the same tooltip content on hover and focus.
- Explicitly layer `.nameplate` above `.skillcape`.
- Preserve all existing character-sheet, equipment, chat, and caching behavior.

## File Structure

- Create `src/lib/trophyRoom.ts`: display types, fixed thresholds, cape derivation, trophy derivation, and stewardship qualification.
- Create `src/lib/trophyRoom.test.ts`: pure boundary, missing-data, sparse-profile, and celebrity-profile tests.
- Modify `src/lib/githubCharacter.ts`: add `trophyRoom` to `CharacterSheet` and derive it once during sheet construction.
- Create `src/components/TrophyWall.tsx`: semantic wall zones, display buttons, visual item primitives, and tooltip markup.
- Create `src/components/TrophyWall.test.tsx`: static-markup accessibility and complete-display rendering tests.
- Modify `src/components/Viewport.tsx`: replace outdoor scenery with inn layers and mount `TrophyWall` without disturbing portrait interactions.
- Create `src/components/Viewport.test.tsx`: scene-structure and foreground-layer regression tests.
- Modify `src/App.css`: inn scenery, trophy zones/items/tooltips, nameplate stacking, and desktop density.
- Create `.superpowers/sdd/inn-desktop-acceptance.mjs` as an ignored local artifact: real-Chrome production-shaped desktop checks.

---

### Task 1: Typed Skillcape Collection

**Files:**
- Create: `src/lib/trophyRoom.ts`
- Create: `src/lib/trophyRoom.test.ts`

**Interfaces:**
- Consumes: `SkillName`, `Prestige`, and `Record<SkillName, number>` from `githubCharacter.ts`.
- Produces: `TrophyRoom`, `WallDisplay`, and `buildTrophyRoom(input: TrophyRoomInput): TrophyRoom`.

- [ ] **Step 1: Write the failing cape tests**

Create the test fixtures and assertions below. Use all ten skill keys so the test input remains a real `Record<SkillName, number>`.

```ts
import { describe, expect, it } from "vitest";
import type { GitHubRepo, SkillName } from "./githubCharacter";
import { buildTrophyRoom } from "./trophyRoom";

const skills = {
  Attack: 99, Strength: 99, Defence: 40, Ranged: 1, Magic: 1,
  Crafting: 1, Mining: 1, Smithing: 1, Prayer: 1, Hitpoints: 50
} satisfies Record<SkillName, number>;

const skillScores = {
  Attack: 5_000, Strength: 9_000, Defence: 40, Ranged: 1, Magic: 1,
  Crafting: 1, Mining: 1, Smithing: 1, Prayer: 1, Hitpoints: 50
} satisfies Record<SkillName, number>;

describe("buildTrophyRoom Skillcapes", () => {
  it("creates one wall hook for every level-99 skill", () => {
    const room = buildTrophyRoom({
      skills, skillScores, followers: 0, accountCreatedAt: "2026-01-01T00:00:00Z",
      repos: [], now: new Date("2026-07-12T00:00:00Z")
    });
    expect(room.displays.filter((item) => item.kind === "cape").map((item) => item.id))
      .toEqual(["cape:Attack", "cape:Strength"]);
  });

  it("marks only the highest-scoring mastery as equipped and trims it", () => {
    const room = buildTrophyRoom({
      skills, skillScores, followers: 0, accountCreatedAt: "2026-01-01T00:00:00Z",
      repos: [], now: new Date("2026-07-12T00:00:00Z")
    });
    expect(room.displays.filter((item) => item.kind === "cape").map((item) => ({
      id: item.id, equipped: item.equipped, trimmed: item.trimmed
    }))).toEqual([
      { id: "cape:Attack", equipped: false, trimmed: false },
      { id: "cape:Strength", equipped: true, trimmed: true }
    ]);
  });
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run: `npm test -- src/lib/trophyRoom.test.ts`

Expected: FAIL because `./trophyRoom` does not exist.

- [ ] **Step 3: Implement the types and cape derivation**

Create `src/lib/trophyRoom.ts` with these public shapes and cape mapping. Keep the stable `SKILL_ORDER` so displays never reorder when scores tie.

```ts
import type { GitHubRepo, SkillName } from "./githubCharacter";

export type TrophyMaterial = "Bronze" | "Silver" | "Gold" | "Runite" | "Legendary";
export type WallZone = "cape-hooks" | "upper-wall" | "trophy-shelf";

export type WallDisplay = {
  id: string;
  kind: "cape" | "trophy";
  zone: WallZone;
  name: string;
  material: TrophyMaterial | null;
  evidence: string;
  description: string;
  skill: SkillName | null;
  equipped: boolean;
  trimmed: boolean;
};

export type TrophyRoom = { displays: WallDisplay[] };

export type TrophyRoomInput = {
  skills: Record<SkillName, number>;
  skillScores: Record<SkillName, number>;
  followers: number;
  accountCreatedAt: string;
  repos: GitHubRepo[];
  now: Date;
};

const SKILL_ORDER: SkillName[] = [
  "Attack", "Strength", "Defence", "Ranged", "Magic",
  "Crafting", "Mining", "Smithing", "Prayer", "Hitpoints"
];

export function buildTrophyRoom(input: TrophyRoomInput): TrophyRoom {
  const mastered = SKILL_ORDER.filter((skill) => input.skills[skill] === 99);
  const worn = mastered.reduce<SkillName | null>((best, skill) =>
    best === null || input.skillScores[skill] > input.skillScores[best] ? skill : best,
  null);

  const capes: WallDisplay[] = mastered.map((skill) => ({
    id: `cape:${skill}`,
    kind: "cape",
    zone: "cape-hooks",
    name: `${skill} Skillcape${mastered.length > 1 && skill === worn ? " (t)" : ""}`,
    material: null,
    evidence: `Level 99 ${skill}`,
    description: `Mastery earned at level 99 ${skill}.`,
    skill,
    equipped: skill === worn,
    trimmed: mastered.length > 1 && skill === worn
  }));

  return { displays: capes };
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/lib/trophyRoom.test.ts`

Expected: 2 tests pass.

- [ ] **Step 5: Commit the cape domain slice**

```bash
git add src/lib/trophyRoom.ts src/lib/trophyRoom.test.ts
git commit -m "feat: derive earned skillcape collection"
```

---

### Task 2: Honest GitHub Trophy Derivation

**Files:**
- Modify: `src/lib/trophyRoom.ts`
- Modify: `src/lib/trophyRoom.test.ts`

**Interfaces:**
- Consumes: the `TrophyRoomInput` established in Task 1.
- Produces: deterministic trophy `WallDisplay` records appended after cape records.

- [ ] **Step 1: Add failing threshold, stewardship, and omission tests**

Add a `repo()` fixture returning a complete `GitHubRepo`, then assert the exact boundary behavior:

```ts
const repo = (overrides: Partial<GitHubRepo> = {}): GitHubRepo => ({
  id: 1, name: "kernel", full_name: "dev/kernel", html_url: "https://github.com/dev/kernel",
  description: null, language: "C", stargazers_count: 100, forks_count: 10,
  watchers_count: 100, archived: false, fork: false, updated_at: "2026-07-01T00:00:00Z",
  homepage: null, size: 1, open_issues_count: 0, created_at: "2024-01-01T00:00:00Z",
  pushed_at: "2026-07-01T00:00:00Z", is_template: false,
  ...overrides
});

const lowSkills = { ...skills, Attack: 1, Strength: 1 };
const lowScores = { ...skillScores, Attack: 1, Strength: 1 };

it("upgrades each earned trophy at exact material boundaries", () => {
  const room = buildTrophyRoom({
    skills: lowSkills, skillScores: lowScores, followers: 1_000,
    accountCreatedAt: "2016-07-12T00:00:00Z",
    repos: [repo({ stargazers_count: 1_000, forks_count: 100 })],
    now: new Date("2026-07-12T00:00:00Z")
  });
  expect(room.displays.filter((item) => item.kind === "trophy").map((item) => [item.id, item.material]))
    .toEqual([
      ["trophy:stars", "Runite"], ["trophy:followers", "Gold"],
      ["trophy:forks", "Gold"], ["trophy:veteran", "Runite"],
      ["trophy:stewardship", "Bronze"]
    ]);
});

it("omits unearned trophies and invalid stewardship timestamps", () => {
  const room = buildTrophyRoom({
    skills: lowSkills, skillScores: lowScores, followers: 0,
    accountCreatedAt: "not-a-date", repos: [repo({ stargazers_count: 0, forks_count: 0, pushed_at: null })],
    now: new Date("2026-07-12T00:00:00Z")
  });
  expect(room.displays).toEqual([]);
});
```

Add the celebrity-scale assertion below; it proves the wall model does not cap or drop distinct earned records:

```ts
it("retains every legendary trophy for a celebrity-scale profile", () => {
  const repos = Array.from({ length: 50 }, (_, index) => repo({
    id: index + 1,
    name: `repo-${index + 1}`,
    full_name: `dev/repo-${index + 1}`,
    stargazers_count: index === 0 ? 10_000 : 0,
    forks_count: index === 0 ? 10_000 : 0
  }));
  const room = buildTrophyRoom({
    skills: lowSkills,
    skillScores: lowScores,
    followers: 100_000,
    accountCreatedAt: "2006-07-12T00:00:00Z",
    repos,
    now: new Date("2026-07-12T00:00:00Z")
  });
  const trophies = room.displays.filter((item) => item.kind === "trophy");
  expect(trophies).toHaveLength(5);
  expect(trophies.every((item) => item.material === "Legendary")).toBe(true);
});
```

- [ ] **Step 2: Run the focused suite and verify RED**

Run: `npm test -- src/lib/trophyRoom.test.ts`

Expected: FAIL because only cape records are currently returned.

- [ ] **Step 3: Implement fixed threshold tables and material selection**

Add the exact spec thresholds and a helper that returns `null` below bronze:

```ts
const MATERIALS: TrophyMaterial[] = ["Bronze", "Silver", "Gold", "Runite", "Legendary"];
const THRESHOLDS = {
  stars: [1, 10, 100, 1_000, 10_000],
  followers: [10, 100, 1_000, 10_000, 100_000],
  forks: [1, 10, 100, 1_000, 10_000],
  veteran: [1, 3, 5, 10, 15],
  stewardship: [1, 3, 10, 25, 50]
} as const;

function materialFor(value: number, thresholds: readonly number[]): TrophyMaterial | null {
  let tier = -1;
  thresholds.forEach((threshold, index) => { if (value >= threshold) tier = index; });
  return tier < 0 ? null : MATERIALS[tier];
}
```

Compute only original-repository stars and forks. A stewardship repository must be original, non-archived, have valid creation/push times at least 365 days apart, and have its latest push no more than 365 days before `input.now`. Calculate whole account years using completed UTC anniversaries rather than milliseconds divided by 365.

Use a local `addTrophy(id, name, value, thresholds, evidence, description, zone)` helper to append only records with a non-null material. Use IDs and names exactly as tested: `trophy:stars` / Star Relic, `trophy:followers` / Fellowship Standard, `trophy:forks` / Forked Anvil, `trophy:veteran` / Veteran's Plaque, and `trophy:stewardship` / Steward's Lantern.

- [ ] **Step 4: Run focused and full domain tests**

Run: `npm test -- src/lib/trophyRoom.test.ts src/lib/githubCharacter.test.ts src/lib/equipment.test.ts`

Expected: all tests pass with zero failures.

- [ ] **Step 5: Commit trophy derivation**

```bash
git add src/lib/trophyRoom.ts src/lib/trophyRoom.test.ts
git commit -m "feat: derive GitHub trophy wall displays"
```

---

### Task 3: Attach the Trophy Room to CharacterSheet

**Files:**
- Modify: `src/lib/githubCharacter.ts`
- Modify: `src/lib/githubCharacter.test.ts`

**Interfaces:**
- Consumes: `buildTrophyRoom(TrophyRoomInput)` from Task 2.
- Produces: `CharacterSheet.trophyRoom: TrophyRoom` for renderers.

- [ ] **Step 1: Write a failing integration test**

Add a test beside the prestige tests using the existing `baseUser` and repository fixture:

```ts
it("attaches earned wall displays without making additional requests", () => {
  const sheet = calculateCharacterSheet(
    { ...baseUser, followers: 1_000, created_at: "2016-07-12T00:00:00Z" },
    [{ ...baseRepo, fork: false, stargazers_count: 100, forks_count: 10 }],
    new Date("2026-07-12T00:00:00Z")
  );
  expect(sheet.trophyRoom.displays.map((item) => item.id)).toEqual(expect.arrayContaining([
    "trophy:stars", "trophy:followers", "trophy:forks", "trophy:veteran"
  ]));
});
```

- [ ] **Step 2: Run the integration test and verify RED**

Run: `npm test -- src/lib/githubCharacter.test.ts`

Expected: FAIL because `CharacterSheet` has no `trophyRoom` property.

- [ ] **Step 3: Wire the domain output into sheet construction**

Import `buildTrophyRoom` and `TrophyRoom`. Add `trophyRoom: TrophyRoom` to `CharacterSheet`. Immediately after calculating `prestige`, call:

```ts
const trophyRoom = buildTrophyRoom({
  skills,
  skillScores,
  followers: user.followers,
  accountCreatedAt: user.created_at,
  repos,
  now
});
```

Return `trophyRoom` in the `CharacterSheet` object. Do not call `fetch`, `requestGitHub`, or change cache/request code.

- [ ] **Step 4: Run integration and full tests**

Run: `npm test`

Expected: all tests pass, including the new integration assertion.

- [ ] **Step 5: Commit the sheet integration**

```bash
git add src/lib/githubCharacter.ts src/lib/githubCharacter.test.ts
git commit -m "feat: attach trophy room to character sheets"
```

---

### Task 4: Accessible Trophy Wall Component

**Files:**
- Create: `src/components/TrophyWall.tsx`
- Create: `src/components/TrophyWall.test.tsx`

**Interfaces:**
- Consumes: `displays: WallDisplay[]` and the existing `SKILL_COLORS` map.
- Produces: `<TrophyWall displays={sheet.trophyRoom.displays} />` with three semantic zones and focus/hover tooltips.

- [ ] **Step 1: Write failing static-markup tests**

Create two displays (one cape and one trophy), render with `renderToStaticMarkup`, and assert:

```ts
expect(markup).toContain('class="trophy-wall"');
expect(markup).toContain('aria-label="Strength Skillcape (t). Level 99 Strength. Mastery earned at level 99 Strength."');
expect(markup).toContain('data-equipped="true"');
expect(markup).toContain('class="wall-display-tooltip"');
expect(markup).toContain('Runite Star Relic');
expect(markup.match(/type="button"/g)).toHaveLength(2);
```

Add a second test with 15 displays and assert every unique display ID occurs exactly once. Buttons must not be disabled and must not contain anchors.

- [ ] **Step 2: Run the component test and verify RED**

Run: `npm test -- src/components/TrophyWall.test.tsx`

Expected: FAIL because `TrophyWall.tsx` does not exist.

- [ ] **Step 3: Implement semantic zones and display buttons**

Implement `TrophyWall` by filtering the fixed zone order `cape-hooks`, `upper-wall`, `trophy-shelf`. Each zone is a `<section aria-label>` containing a list. Each record renders as:

```tsx
<li className="wall-display-item" key={display.id}>
  <button
    type="button"
    className={`wall-display ${display.kind} ${display.material?.toLowerCase() ?? "skillcape"}`}
    aria-label={`${display.name}. ${display.evidence}. ${display.description}`}
    data-display-id={display.id}
    data-equipped={display.equipped || undefined}
    style={display.skill ? { "--display-color": SKILL_COLORS[display.skill] } as CSSProperties : undefined}
  >
    <span className="wall-display-art" aria-hidden="true" />
    <span className="wall-display-tooltip" role="tooltip">
      <strong>{display.material ? `${display.material} ${display.name}` : display.name}</strong>
      <span>{display.evidence}</span>
      <span>{display.description}</span>
      {display.equipped ? <em>Currently equipped</em> : null}
    </span>
  </button>
</li>
```

Do not add React tooltip state: CSS `:hover` and `:focus-visible` provide identical disclosure, while native buttons supply keyboard focus and tap behavior without navigation.

- [ ] **Step 4: Run component and full tests**

Run: `npm test -- src/components/TrophyWall.test.tsx && npm test`

Expected: focused tests and full suite pass.

- [ ] **Step 5: Commit the wall component**

```bash
git add src/components/TrophyWall.tsx src/components/TrophyWall.test.tsx
git commit -m "feat: render accessible trophy wall"
```

---

### Task 5: Replace the Meadow with the Desktop Guild Inn

**Files:**
- Modify: `src/components/Viewport.tsx`
- Create: `src/components/Viewport.test.tsx`
- Modify: `src/App.css`

**Interfaces:**
- Consumes: `TrophyWall` from Task 4 and `sheet.trophyRoom.displays` from Task 3.
- Produces: the complete desktop inn scene while retaining the existing player menu, portrait, worn cape, status orbs, nameplate, class line, and build tag.

- [ ] **Step 1: Write failing structure and cape-overlap regression tests**

Use `renderToStaticMarkup(<Viewport sheet={fixture as CharacterSheet} say={() => undefined} />)` with a complete minimal fixture. Assert the new structure and absence of outdoor layers:

```ts
expect(markup).toContain('class="inn-back-wall"');
expect(markup).toContain('class="inn-hearth"');
expect(markup).toContain('class="inn-floor"');
expect(markup).toContain('class="trophy-wall"');
expect(markup).not.toContain('class="scene-hills"');
expect(markup).not.toContain('class="scene-tree');
```

In the same test file, follow the existing Node-file-read pattern and assert:

```ts
const styles = readFileSync(new URL("../App.css", import.meta.url), "utf8");
expect(styles).toMatch(/\.skillcape\s*\{[^}]*z-index:\s*0/s);
expect(styles).toMatch(/\.nameplate\s*\{[^}]*position:\s*relative[^}]*z-index:\s*5/s);
```

- [ ] **Step 2: Run the viewport test and verify RED**

Run: `npm test -- src/components/Viewport.test.tsx`

Expected: FAIL because the outdoor elements remain, inn elements are absent, and `.nameplate` has no foreground layer.

- [ ] **Step 3: Replace outdoor markup with inn layers**

Remove `scene-sky`, stars, aurora, hills, ground, both trees, rocks, campfire, fireworks, shooting star, phoenix, and minimap from `Viewport`. Preserve status orbs. Before `.player`, render:

```tsx
<div className="inn-back-wall" aria-hidden="true">
  <span className="inn-stonework" />
  <span className="inn-beam beam-left" />
  <span className="inn-beam beam-right" />
  <span className="inn-beam beam-top" />
  <span className="inn-banner banner-left" />
  <span className="inn-banner banner-right" />
</div>
<TrophyWall displays={sheet.trophyRoom.displays} />
<span className="inn-hearth" aria-hidden="true">
  <i className="hearth-mantle" />
  <i className="hearth-fire" />
</span>
<div className="inn-floor" aria-hidden="true" />
```

Import `TrophyWall`. Keep prestige crown and worn-cape behavior intact.

- [ ] **Step 4: Implement the desktop inn and display CSS**

Replace the obsolete outdoor-scene selectors with layered desktop rules. Use the existing `.viewport { position: relative; overflow: hidden; }` boundary and establish this stack:

```css
.inn-back-wall { position: absolute; inset: 0 0 27%; z-index: 0; background: linear-gradient(#403225, #2b2119); }
.inn-stonework { position: absolute; inset: 0 0 38%; background: repeating-linear-gradient(0deg, transparent 0 34px, rgba(0,0,0,.24) 35px 37px), repeating-linear-gradient(90deg, #51463d 0 72px, #413830 73px 76px); }
.inn-beam { position: absolute; z-index: 2; background: linear-gradient(90deg, #2a170e, #704426 45%, #2a170e); box-shadow: 0 3px 0 #160d08; }
.beam-left { inset: 0 auto 0 7%; width: 22px; }
.beam-right { inset: 0 7% 0 auto; width: 22px; }
.beam-top { top: 14%; right: 0; left: 0; height: 20px; }
.inn-floor { position: absolute; inset: 73% 0 0; z-index: 0; background: repeating-linear-gradient(90deg, #392316 0 78px, #21140d 79px 83px); border-top: 8px solid #1b100a; }
.inn-hearth { position: absolute; right: 7%; bottom: 15%; z-index: 3; width: 112px; height: 132px; background: linear-gradient(90deg, #4b4038, #716359 50%, #40362f); border: 4px solid #241b16; }
.hearth-mantle { position: absolute; top: -10px; right: -12px; left: -12px; height: 14px; background: #5b351d; box-shadow: 0 4px 0 #23130b; }
.hearth-fire { position: absolute; right: 23px; bottom: 10px; left: 23px; height: 54px; background: radial-gradient(ellipse at 50% 100%, #fff08a 0 12%, #ff9a2e 30%, #9e2e12 58%, transparent 62%); filter: drop-shadow(0 0 15px rgba(255,145,45,.6)); }
.trophy-wall { position: absolute; z-index: 3; top: 18%; right: 9%; left: 9%; display: grid; grid-template-columns: minmax(260px, 1.35fr) minmax(180px, .8fr); grid-template-areas: "capes upper" "capes shelf"; gap: 22px 34px; align-items: start; }
.wall-zone { min-width: 0; }
.wall-zone.cape-hooks { grid-area: capes; }
.wall-zone.upper-wall { grid-area: upper; }
.wall-zone.trophy-shelf { grid-area: shelf; }
.wall-display-list { display: flex; flex-wrap: wrap; justify-content: center; gap: 24px 28px; margin: 0; padding: 18px 20px; list-style: none; }
.wall-display { position: relative; width: 58px; height: 70px; padding: 0; border: 0; background: transparent; color: #fff5d6; cursor: help; }
.wall-display:focus-visible { outline: 3px solid var(--hud-yellow); outline-offset: 4px; }
.wall-display-art { position: absolute; inset: 4px; display: block; filter: drop-shadow(2px 4px 1px rgba(0,0,0,.7)); }
.wall-display.cape .wall-display-art { background: linear-gradient(110deg, rgba(255,255,255,.25), transparent 35%), var(--display-color, #57c25f); clip-path: polygon(35% 0, 65% 0, 86% 100%, 14% 100%); }
.wall-display.trophy .wall-display-art { border: 4px solid #5a341d; background: currentColor; clip-path: polygon(20% 0, 80% 0, 92% 70%, 62% 70%, 62% 100%, 38% 100%, 38% 70%, 8% 70%); }
.wall-display.bronze { color: #b56a36; } .wall-display.silver { color: #c8d0d8; } .wall-display.gold { color: #f1c84b; } .wall-display.runite { color: #56b9c2; } .wall-display.legendary { color: #b86cff; }
.wall-display-tooltip { position: absolute; bottom: calc(100% + 10px); left: 50%; z-index: 50; display: none; width: 230px; padding: 9px 11px; border: 2px solid #8b744b; background: #17130f; color: #eee4cc; text-align: left; box-shadow: 0 8px 20px rgba(0,0,0,.65); transform: translateX(-50%); }
.wall-display-tooltip > * { display: block; } .wall-display-tooltip strong { color: var(--hud-yellow); } .wall-display-tooltip em { color: var(--hud-green); }
.wall-display:hover .wall-display-tooltip, .wall-display:focus-visible .wall-display-tooltip { display: block; }
.nameplate { position: relative; z-index: 5; margin-top: .5rem; }
.player { z-index: 10; }
```

Use `.wall-zone.cape-hooks::before` as a timber rail, `.wall-display-item::before` as its hook, `.wall-zone.trophy-shelf::after` as a timber shelf edge, and `.wall-display.trophy[data-display-id="trophy:veteran"] .wall-display-art` as a rectangular plaque variant. Give each pseudo-element `content: ""`, `position: absolute`, and colors drawn from the beam/hearth palette above. Remove the now-unreferenced outdoor animation keyframes `aurora-drift`, `shoot`, `burst`, and `phoenix-bob`.

- [ ] **Step 5: Run focused tests, full suite, and build**

Run: `npm test -- src/components/Viewport.test.tsx src/components/TrophyWall.test.tsx && npm test && npm run build && git diff --check`

Expected: all tests pass, production build exits 0, and diff check emits no errors.

- [ ] **Step 6: Commit the desktop inn**

```bash
git add src/components/Viewport.tsx src/components/Viewport.test.tsx src/App.css
git commit -m "feat: replace meadow with guild inn"
```

---

### Task 6: Desktop Browser Acceptance and Release Gate

**Files:**
- Create locally/ignored: `.superpowers/sdd/inn-desktop-acceptance.mjs`
- Modify only if acceptance finds a defect: files owned by Tasks 1-5 plus their focused tests.

**Interfaces:**
- Consumes: the complete local production build.
- Produces: objective desktop evidence before merge and the same checks against the canonical domain after deployment.

- [ ] **Step 1: Create the desktop acceptance harness**

Use Playwright with installed Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`. Accept `ACCEPTANCE_BASE_URL`, defaulting to `http://127.0.0.1:5199`. At viewport `1440x1000`, navigate to `/character/torvalds`, open no tabs, and collect:

```js
const evidence = await page.evaluate(() => {
  const displays = [...document.querySelectorAll('.wall-display')];
  const nameplate = document.querySelector('.nameplate').getBoundingClientRect();
  const cape = document.querySelector('.skillcape')?.getBoundingClientRect() ?? null;
  const rects = displays.map((element) => ({ id: element.dataset.displayId, rect: element.getBoundingClientRect().toJSON() }));
  const overlaps = rects.flatMap((left, index) => rects.slice(index + 1).filter((right) =>
    left.rect.left < right.rect.right && left.rect.right > right.rect.left &&
    left.rect.top < right.rect.bottom && left.rect.bottom > right.rect.top
  ).map((right) => [left.id, right.id]));
  return {
    displayCount: displays.length,
    uniqueDisplayCount: new Set(displays.map((item) => item.dataset.displayId)).size,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    overlaps,
    nameplateZ: getComputedStyle(document.querySelector('.nameplate')).zIndex,
    capeZ: cape ? getComputedStyle(document.querySelector('.skillcape')).zIndex : null,
    nameplate,
    cape
  };
});
```

Also focus the first wall display and assert its tooltip is visible; hover the last display and assert the same. Record console errors, page errors, failed requests, GitHub response statuses, and a full-page screenshot.

- [ ] **Step 2: Run local desktop acceptance**

Run build/preview in separate terminals, then:

`$env:ACCEPTANCE_BASE_URL='http://127.0.0.1:5199'; node .superpowers/sdd/inn-desktop-acceptance.mjs`

Expected: at least one display for `torvalds`, all IDs unique, zero pair overlaps, no horizontal overflow, nameplate z-index 5 greater than cape z-index 0, visible focus and hover tooltips, GitHub responses 200, and no console/page/request errors.

- [ ] **Step 3: Fix any acceptance defect with a fresh RED-GREEN cycle**

For each defect, first add the smallest failing unit/component regression or explicit failing acceptance assertion. Run it and observe the expected failure, apply the minimal fix, then rerun the focused test and the complete acceptance harness. Do not weaken overlap, accessibility, or error assertions to obtain green output.

- [ ] **Step 4: Run the final local release gate**

Run: `npm ci && npm test && npm run build && git diff --check && git status --short`

Expected: clean install, every test passes, build exits 0, diff check emits nothing, and status is clean after committing any acceptance fix.

- [ ] **Step 5: Request whole-branch review before production release**

Review the complete diff from `origin/main...HEAD` for spec compliance, data honesty, regression risk, accessibility, and desktop visual behavior. Resolve all Critical or Important findings with test-first fixes and rerun Step 4. Do not merge before this review is clean.

- [ ] **Step 6: Push, merge, and verify automatic deployment**

Push the branch, open a PR, merge only after checks/review are clean, and watch the exact `deploy-pages.yml` run for the merge SHA. Confirm through the Cloudflare Pages API that the latest production deployment commit equals the merge SHA and that `osrshub.conalhickey.com` is active.

- [ ] **Step 7: Run canonical production desktop acceptance**

Run:

`$env:ACCEPTANCE_BASE_URL='https://osrshub.conalhickey.com'; node .superpowers/sdd/inn-desktop-acceptance.mjs`

Expected: the same assertions as Step 2 pass against production, and both `/` and `/character/torvalds` return HTTP 200.
