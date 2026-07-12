# Inventory Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill all 11 worn-equipment slots and expand the backpack into a deterministic, data-backed, count-bearing inventory without adding GitHub API calls.

**Architecture:** Extract equipment derivation into a pure `src/lib/equipment.ts` domain module. Keep GitHub fetching and complete character-sheet assembly in `githubCharacter.ts`, and make `EquipmentTab.tsx` render the finished equipment model without owning derivation rules.

**Tech Stack:** React 19, TypeScript 5.8, Vite 7, Vitest 3, `react-dom/server`, GitHub REST API, Cloudflare Pages.

## Global Constraints

- Make no GitHub requests beyond the existing user request and paginated repository requests.
- Preserve the behavior and rarity thresholds of Main hand, Off hand, Cape, Amulet, and Ring.
- Return exactly 11 unique worn slots in canonical order.
- Use named gray Common fallbacks; every slot remains examinable.
- Cap the backpack at 28 real items and add no decorative junk or fake padding items.
- Keep language and topic stacks distinct even when their names match.
- Gold uses stars from non-fork repositories in the fetched set and the locked formula from the design spec.
- Bump the cache namespace to `github-character:v5:<username>`.
- Add no production or test dependency for this feature.
- Do not stage or overwrite the user's existing `package.json`, `package-lock.json`, `shot.mjs`, or `.superpowers/` changes.
- Follow TDD for every behavior change: failing test, observed failure, minimal implementation, observed pass, then commit.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `src/lib/equipment.ts` | Equipment types, normalization, rarity, 11 slot builders, backpack construction, gold, and count formatting. |
| `src/lib/equipment.test.ts` | Isolated table-driven domain tests. |
| `src/lib/githubCharacter.ts` | GitHub response types, adapter into `EquipmentInput`, sheet assembly, and v5 cache key. |
| `src/lib/githubCharacter.test.ts` | GitHub fixture defaults and character-sheet integration assertions. |
| `src/components/tabs/EquipmentTab.tsx` | Rendering, tooltips, accessible labels, and examine messages. |
| `src/components/tabs/EquipmentTab.test.tsx` | Static server-render assertions without a new dependency. |
| `src/App.css` | Fallback treatment, item-kind colors, and stack badges. |

---

### Task 1: Extend the retained GitHub payload and invalidate v4 cache records

**Files:**
- Modify: `src/lib/githubCharacter.ts:1-31,515-517`
- Modify: `src/lib/githubCharacter.test.ts:2-57`

**Interfaces:**
- Produces: `GitHubUser.public_gists`, the six additional `GitHubRepo` fields, and `getCharacterCacheKey(username): string` returning the v5 namespace.

- [ ] **Step 1: Write the failing cache-key test and complete fixture defaults**

Add `getCharacterCacheKey` to the import list and add this test:

```ts
describe("character cache key", () => {
  it("uses the v5 namespace for typed inventory records", () => {
    expect(getCharacterCacheKey("ConalH")).toBe("github-character:v5:ConalH");
  });
});
```

Extend `baseUser` and `repo()` with deterministic defaults:

```ts
public_gists: 0
```

```ts
size: 0,
open_issues_count: 0,
created_at: "2026-01-01T00:00:00Z",
pushed_at: "2026-06-01T00:00:00Z",
license: null,
is_template: false,
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- src/lib/githubCharacter.test.ts
```

Expected: FAIL showing `github-character:v4:ConalH` instead of v5.

- [ ] **Step 3: Extend the API types and change the cache key**

Add the exact fields:

```ts
export type GitHubUser = {
  // existing fields stay unchanged
  public_gists: number;
};

export type GitHubRepo = {
  // existing fields stay unchanged
  size: number;
  open_issues_count: number;
  created_at: string;
  pushed_at: string | null;
  license?: { spdx_id: string | null } | null;
  is_template: boolean;
};
```

Change the cache key implementation:

```ts
export function getCharacterCacheKey(username: string): string {
  return `github-character:v5:${username}`;
}
```

- [ ] **Step 4: Verify GREEN and the production build**

Run:

```bash
npm test -- src/lib/githubCharacter.test.ts
npm run build
```

Expected: character tests pass and Vite completes successfully.

- [ ] **Step 5: Commit only the payload/cache files**

```bash
git add src/lib/githubCharacter.ts src/lib/githubCharacter.test.ts
git commit -m "refactor: retain inventory data from GitHub"
```

---

### Task 2: Establish the equipment domain types and shared helpers

**Files:**
- Create: `src/lib/equipment.ts`
- Create: `src/lib/equipment.test.ts`

**Interfaces:**
- Produces: `EquipmentInput`, `EquipmentRepoInput`, `EquipmentSlot`, `EquipmentItem`, `BackpackItem`, `CharacterEquipment`, `normaliseCount()`, `rarityFromThresholds()`, and all slot rarity functions.
- Consumes later: Tasks 3-6 import these exact names.

- [ ] **Step 1: Write failing normalization and rarity tests**

Create `src/lib/equipment.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  getAmmoRarity,
  getBodyRarity,
  getFeetRarity,
  getHandsRarity,
  getHeadRarity,
  getLegsRarity,
  normaliseCount,
  rarityFromThresholds
} from "./equipment";

describe("equipment foundations", () => {
  it.each([
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
    [-8, 0],
    [4.9, 4]
  ])("normalises %s to %s", (value, expected) => {
    expect(normaliseCount(value)).toBe(expected);
  });

  it("maps every new slot at and below its first threshold", () => {
    expect(rarityFromThresholds(1, [2, 4, 8, 15])).toBe("Common");
    expect(getHeadRarity(2)).toBe("Uncommon");
    expect(getBodyRarity(10)).toBe("Rare");
    expect(getLegsRarity(6)).toBe("Epic");
    expect(getHandsRarity(500)).toBe("Legendary");
    expect(getFeetRarity(15)).toBe("Epic");
    expect(getAmmoRarity(1)).toBe("Uncommon");
  });
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run:

```bash
npm test -- src/lib/equipment.test.ts
```

Expected: FAIL because `./equipment` does not exist.

- [ ] **Step 3: Create final domain types and helper implementations**

Create `src/lib/equipment.ts` with these public contracts:

```ts
export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

export const EQUIPMENT_SLOT_ORDER = [
  "Head", "Cape", "Amulet", "Ammo", "Main hand", "Body",
  "Off hand", "Legs", "Hands", "Feet", "Ring"
] as const;

export type EquipmentSlot = (typeof EQUIPMENT_SLOT_ORDER)[number];
export type CountedName = { name: string; count: number };

export type EquipmentItem = {
  slot: EquipmentSlot;
  name: string;
  detail: string;
  rarity: Rarity;
  isFallback: boolean;
  href?: string;
};

export type BackpackItemKind =
  | "currency" | "license" | "language"
  | "topic" | "archive" | "template";

export type BackpackItem = {
  id: string;
  kind: BackpackItemKind;
  name: string;
  abbreviation: string;
  count: number;
  examine: string;
};

export type CharacterEquipment = {
  items: EquipmentItem[];
  backpack: BackpackItem[];
};

export type EquipmentRepoInput = {
  name: string;
  fullName: string;
  htmlUrl: string;
  stars: number;
  forks: number;
  updatedAt: string;
  topics: string[];
  sizeKb: number;
  openIssuesCount: number;
  createdAt: string;
  pushedAt: string | null;
  licenseSpdxId: string | null;
  archived: boolean;
  isTemplate: boolean;
  fork: boolean;
};

export type EquipmentInput = {
  user: { followers: number; publicGists: number };
  repos: EquipmentRepoInput[];
  accountAgeYears: number;
  languageCounts: CountedName[];
  topicCounts: CountedName[];
  now: Date;
  prestige: { capeSkill: string | null; trimmed: boolean };
};
```

Add the exact normalization and rarity helpers:

```ts
export function normaliseCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

export function rarityFromThresholds(
  value: number,
  [uncommon, rare, epic, legendary]: [number, number, number, number]
): Rarity {
  if (value >= legendary) return "Legendary";
  if (value >= epic) return "Epic";
  if (value >= rare) return "Rare";
  if (value >= uncommon) return "Uncommon";
  return "Common";
}

export const getHeadRarity = (value: number) => rarityFromThresholds(value, [2, 4, 8, 15]);
export const getBodyRarity = (mb: number) => rarityFromThresholds(mb, [1, 10, 100, 1000]);
export const getLegsRarity = (years: number) => rarityFromThresholds(years, [1, 3, 6, 10]);
export const getHandsRarity = (value: number) => rarityFromThresholds(value, [5, 20, 100, 500]);
export const getFeetRarity = (value: number) => rarityFromThresholds(value, [3, 8, 15, 30]);
export const getAmmoRarity = (value: number) => rarityFromThresholds(value, [1, 10, 30, 100]);
```

Move the existing five rarity functions into this module unchanged.

- [ ] **Step 4: Run the isolated test and full build**

```bash
npm test -- src/lib/equipment.test.ts
npm run build
```

Expected: PASS; the unused module compiles without changing application output.

- [ ] **Step 5: Commit the domain foundation**

```bash
git add src/lib/equipment.ts src/lib/equipment.test.ts
git commit -m "refactor: add equipment domain foundation"
```

---

### Task 3: Derive exactly 11 worn items with honest fallbacks

**Files:**
- Modify: `src/lib/equipment.ts`
- Modify: `src/lib/equipment.test.ts`

**Interfaces:**
- Produces: `buildEquipment(input: EquipmentInput): CharacterEquipment` and the canonical 11-item invariant.
- Consumes: types and rarity helpers from Task 2.

- [ ] **Step 1: Add failing rich-profile, fallback, and tie tests**

Add complete fixture helpers:

```ts
function equipmentRepo(
  overrides: Partial<EquipmentRepoInput> = {}
): EquipmentRepoInput {
  return {
    name: "sample",
    fullName: "owner/sample",
    htmlUrl: "https://github.com/owner/sample",
    stars: 0,
    forks: 0,
    updatedAt: "2026-06-01T00:00:00Z",
    topics: [],
    sizeKb: 0,
    openIssuesCount: 0,
    createdAt: "2025-01-01T00:00:00Z",
    pushedAt: "2026-01-01T00:00:00Z",
    licenseSpdxId: null,
    archived: false,
    isTemplate: false,
    fork: false,
    ...overrides
  };
}

function equipmentInput(
  overrides: Partial<EquipmentInput> = {}
): EquipmentInput {
  return {
    user: { followers: 4, publicGists: 0 },
    repos: [],
    accountAgeYears: 6,
    languageCounts: [],
    topicCounts: [],
    now: new Date("2026-07-01T00:00:00Z"),
    prestige: { capeSkill: null, trimmed: false },
    ...overrides
  };
}

const richInput = equipmentInput({
  user: { followers: 200, publicGists: 12 },
  repos: [equipmentRepo({
    name: "atlas",
    fullName: "owner/atlas",
    stars: 500,
    forks: 30,
    topics: ["ai-agents"],
    sizeKb: 20_480,
    openIssuesCount: 25,
    createdAt: "2018-01-01T00:00:00Z",
    pushedAt: "2026-01-01T00:00:00Z"
  })],
  languageCounts: [{ name: "TypeScript", count: 1 }],
  topicCounts: [{ name: "ai-agents", count: 4 }]
});
```

Add assertions:

```ts
const equipment = buildEquipment(richInput);
expect(equipment.items.map((item) => item.slot)).toEqual(EQUIPMENT_SLOT_ORDER);
expect(equipment.items).toHaveLength(11);
expect(findSlot(equipment.items, "Head").name).toBe("Helm of ai-agents");
expect(findSlot(equipment.items, "Body").name).toBe("Breastplate of atlas");
expect(findSlot(equipment.items, "Legs").name).toBe("Greaves of atlas");
expect(findSlot(equipment.items, "Hands").detail).toContain("issues & pull requests");
expect(findSlot(equipment.items, "Feet").name).toBe("Boots of Wandering");
expect(findSlot(equipment.items, "Ammo").name).toBe("Quiver of Gists");
```

For empty input, assert the six exact new fallbacks and `isFallback: true`.
For equal repository signals, reverse the input array and assert the same
alphabetically selected `fullName` wins both times.

- [ ] **Step 2: Run the focused test and verify RED**

```bash
npm test -- src/lib/equipment.test.ts
```

Expected: FAIL because `buildEquipment` and the new slot builders do not exist.

- [ ] **Step 3: Move the existing five builders and implement the six new builders**

Move Main hand, Off hand, Cape, Amulet, and Ring object construction from the
current `getEquipment()` in `githubCharacter.ts`, copying it into the new module
while the old path remains live until Task 5. Adapt snake-case repository
fields to `EquipmentRepoInput`. Preserve their names, details, thresholds, and
repository links exactly; add `isFallback` to every object.

Use these constructors for every new slot:

```ts
function item(
  slot: EquipmentSlot,
  name: string,
  detail: string,
  rarity: Rarity,
  href?: string
): EquipmentItem {
  return { slot, name, detail, rarity, isFallback: false, ...(href ? { href } : {}) };
}

function fallback(
  slot: EquipmentSlot,
  name: string,
  detail: string
): EquipmentItem {
  return { slot, name, detail, rarity: "Common", isFallback: true };
}
```

Implement stable selection once and reuse it:

```ts
function maxRepo(
  repos: EquipmentRepoInput[],
  score: (repo: EquipmentRepoInput) => number
): EquipmentRepoInput | undefined {
  return [...repos].sort((a, b) =>
    score(b) - score(a) || a.fullName.localeCompare(b.fullName)
  )[0];
}
```

Implement the new slot qualification rules exactly:

```ts
const head = topTopic
  ? item("Head", `Helm of ${topTopic.name}`,
      `Their declared field of study (used on ${topTopic.count} quests)`,
      getHeadRarity(topTopic.count))
  : fallback("Head", "Unadorned Hood", "No field of study declared");

const bodyRepo = maxRepo(repos.filter((r) => normaliseCount(r.sizeKb) > 0), r => normaliseCount(r.sizeKb));
const handsRepo = maxRepo(repos.filter((r) => normaliseCount(r.openIssuesCount) > 0), r => normaliseCount(r.openIssuesCount));

const feet = uniqueTopicCount > 0
  ? item("Feet", "Boots of Wandering", `Trodden through ${uniqueTopicCount} topics`, getFeetRarity(uniqueTopicCount))
  : fallback("Feet", "Barefoot", "The grass is soft here");

const ammo = publicGists > 0
  ? item("Ammo", "Quiver of Gists", `${publicGists} snippets nocked and loosed`, getAmmoRarity(publicGists))
  : fallback("Ammo", "Empty Quiver", "No gists loosed");
```

For Legs, parse both dates, reject non-finite/non-positive spans, score by elapsed
milliseconds, and format months/years exactly as specified in the design.

Return items by mapping `EQUIPMENT_SLOT_ORDER` over a slot-keyed record, not by
relying on construction order. Return `backpack: []` until Task 4.

- [ ] **Step 4: Verify all worn-item tests and the build**

```bash
npm test -- src/lib/equipment.test.ts
npm run build
```

Expected: all equipment tests pass; build remains green.

- [ ] **Step 5: Commit worn-equipment derivation**

```bash
git add src/lib/equipment.ts src/lib/equipment.test.ts
git commit -m "feat: derive all worn equipment slots"
```

---

### Task 4: Build the count-bearing backpack and calibrated gold stack

**Files:**
- Modify: `src/lib/equipment.ts`
- Modify: `src/lib/equipment.test.ts`

**Interfaces:**
- Produces: `calculateReputationGold()`, `formatStackCount()`, and a deterministic `BackpackItem[]` from `buildEquipment()`.

- [ ] **Step 1: Add failing gold, formatting, grouping, and cap tests**

```ts
it.each([
  [0, 0, 0],
  [4, 2, 141],
  [200, 500, 15_794],
  [311_435, 250_769, 6_993_251]
])("mints calibrated gold", (followers, stars, expected) => {
  expect(calculateReputationGold(followers, stars)).toBe(expected);
});

it.each([
  [141, "141"],
  [1_000, "1K"],
  [15_794, "15.8K"],
  [1_000_000, "1M"],
  [6_993_251, "7M"]
])("formats %i as %s", (count, expected) => {
  expect(formatStackCount(count)).toBe(expected);
});
```

Add a backpack fixture containing duplicate MIT licenses, `NOASSERTION`, Go as
both a language and topic, archives, templates, and more than 28 candidates.
Assert priority, counts, separate `language:go`/`topic:go` IDs, omission of
`NOASSERTION`, and final length 28.

- [ ] **Step 2: Run tests and verify RED**

```bash
npm test -- src/lib/equipment.test.ts
```

Expected: FAIL because the gold/formatter/backpack functions are absent.

- [ ] **Step 3: Implement the locked formula and compact formatter**

```ts
export function calculateReputationGold(followers: number, stars: number): number {
  const reputation = Math.sqrt(normaliseCount(followers) * normaliseCount(stars));
  return Math.round((50 * reputation) / (1 + reputation / 280_000));
}

const stackFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1
});

export function formatStackCount(count: number): string {
  return stackFormatter.format(normaliseCount(count));
}
```

- [ ] **Step 4: Implement deterministic backpack construction**

Use these private helper signatures; each returns items already sorted by count
descending and name ascending:

```ts
function currencyItem(gold: number): BackpackItem;
function buildLicenseItems(repos: EquipmentRepoInput[]): BackpackItem[];
function buildSupplyItems(
  languageCounts: CountedName[],
  topicCounts: CountedName[]
): BackpackItem[];
function buildArchiveItems(repos: EquipmentRepoInput[]): BackpackItem[];
function buildTemplateItems(repos: EquipmentRepoInput[]): BackpackItem[];
```

`currencyItem` uses ID `currency:gold`, abbreviation `GP`, and exact-count
examine text. License IDs use `license:<lowercase SPDX>`. Supply IDs use
`language:<lowercase name>` or `topic:<lowercase name>`. Archive and template
IDs are `archive:repos` and `template:repos`.

Build these groups in order: always-present gold pouch, grouped licenses,
languages/topics sorted together by count/name/kind, optional archives, optional
templates. Use kind-prefixed IDs and slice only after concatenating groups:

```ts
function buildBackpack(input: EquipmentInput): BackpackItem[] {
  const originalStars = input.repos
    .filter((repo) => !repo.fork)
    .reduce((sum, repo) => sum + normaliseCount(repo.stars), 0);

  const gold = calculateReputationGold(input.user.followers, originalStars);
  const groups = [
    [currencyItem(gold)],
    buildLicenseItems(input.repos),
    buildSupplyItems(input.languageCounts, input.topicCounts),
    buildArchiveItems(input.repos),
    buildTemplateItems(input.repos)
  ];

  return groups.flat().slice(0, 28);
}
```

Every item stores an exact-count examine sentence. Popular license IDs receive
the approved themed names; every other valid SPDX ID becomes `<ID> Scroll`.

- [ ] **Step 5: Verify the backpack and all domain tests**

```bash
npm test -- src/lib/equipment.test.ts
npm run build
```

Expected: all domain tests pass, including exact gold anchors and the 28-item cap.

- [ ] **Step 6: Commit backpack behavior**

```bash
git add src/lib/equipment.ts src/lib/equipment.test.ts
git commit -m "feat: build reputation backpack items"
```

---

### Task 5: Integrate the equipment domain into character-sheet assembly

**Files:**
- Modify: `src/lib/githubCharacter.ts`
- Modify: `src/lib/githubCharacter.test.ts`

**Interfaces:**
- Consumes: `buildEquipment`, `CharacterEquipment`, and `EquipmentRepoInput` from Task 4.
- Produces: `CharacterSheet.equipment` in its final 11-slot/typed-backpack shape.

- [ ] **Step 1: Add failing character-sheet integration assertions**

Update the rich sheet fixture to include new slot signals. Assert:

```ts
expect(sheet.equipment.items).toHaveLength(11);
expect(new Set(sheet.equipment.items.map((item) => item.slot)).size).toBe(11);
expect(sheet.equipment.items.find((item) => item.slot === "Head")?.name)
  .toBe("Helm of react");
expect(sheet.equipment.backpack[0]).toMatchObject({
  id: "currency:gold",
  kind: "currency"
});
```

Change the missing-data assertion from `backpack: ["No supplies discovered"]`
to one zero-count gold pouch. Expand the empty-profile test to assert all 11
items exist and the six new names are fallbacks.

- [ ] **Step 2: Run character tests and verify RED**

```bash
npm test -- src/lib/githubCharacter.test.ts
```

Expected: FAIL because production sheet assembly still returns five slots and string supplies.

- [ ] **Step 3: Add the adapter and call `buildEquipment()`**

Import domain types/functions and define one adapter:

```ts
function toEquipmentRepo(repo: GitHubRepo): EquipmentRepoInput {
  return {
    name: repo.name,
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    updatedAt: repo.updated_at,
    topics: getRepoTopics(repo),
    sizeKb: repo.size,
    openIssuesCount: repo.open_issues_count,
    createdAt: repo.created_at,
    pushedAt: repo.pushed_at,
    licenseSpdxId: repo.license?.spdx_id ?? null,
    archived: repo.archived,
    isTemplate: repo.is_template,
    fork: repo.fork
  };
}
```

Replace the old `getEquipment()` call with:

```ts
equipment: buildEquipment({
  user: {
    followers: user.followers,
    publicGists: user.public_gists
  },
  repos: repos.map(toEquipmentRepo),
  accountAgeYears: metrics.accountAgeYears,
  languageCounts,
  topicCounts,
  now,
  prestige
}),
```

- [ ] **Step 4: Remove the old equipment domain code**

Delete `EquipmentSlot`, `EquipmentItem`, `CharacterEquipment`, rarity helpers,
`getEquipment()`, and equipment-only `maxRepo()` from `githubCharacter.ts`.
Import `CharacterEquipment` instead. Update test imports so equipment types and
rarity helpers come from `./equipment`.

- [ ] **Step 5: Verify integration tests before updating the renderer**

```bash
npm test
```

Expected: all unit tests pass. Do not commit yet; `EquipmentTab` still needs the
typed-backpack compatibility update before the build can pass.

- [ ] **Step 6: Add the minimal exhaustive renderer compatibility update**

Before committing, make `SLOT_ICONS` and `SLOT_AREAS` exhaustive for all 11
`EquipmentSlot` values and remove the hard-coded `EMPTY_SLOTS` render. Render the
11 typed items with the existing filled-slot treatment; do not add fallback
classes yet. Update the backpack map to use `item.id`, `item.name`,
`item.abbreviation`, and `item.examine`; do not add badge markup or styling yet.
Run:

```bash
npm test
npm run build
```

Expected: all tests pass and the build completes without TypeScript errors.

- [ ] **Step 7: Commit the integrated data path**

```bash
git add src/lib/githubCharacter.ts src/lib/githubCharacter.test.ts src/components/tabs/EquipmentTab.tsx
git commit -m "refactor: integrate equipment domain"
```

---

### Task 6: Render all slots, muted fallbacks, and stack badges

**Files:**
- Modify: `src/components/tabs/EquipmentTab.tsx`
- Create: `src/components/tabs/EquipmentTab.test.tsx`
- Modify: `src/App.css:1652-1774,2182-2251`

**Interfaces:**
- Consumes: final `CharacterEquipment`, `EquipmentSlot`, and `formatStackCount()`.
- Produces: accessible 11-button worn grid and typed four-column backpack UI.

- [ ] **Step 1: Write a failing static rendering test**

Use `renderToStaticMarkup` with this complete minimal model:

```ts
const items = EQUIPMENT_SLOT_ORDER.map((slot) => ({
  slot,
  name: slot === "Head" ? "Unadorned Hood" : `${slot} item`,
  detail: slot === "Head" ? "No field of study declared" : "Derived detail",
  rarity: "Common" as const,
  isFallback: slot === "Head"
}));

const equipment: CharacterEquipment = {
  items,
  backpack: [{
    id: "currency:gold",
    kind: "currency",
    name: "Gold pouch",
    abbreviation: "GP",
    count: 15_794,
    examine: "Reputation minted from followers and stars"
  }]
};

const markup = renderToStaticMarkup(
  <EquipmentTab
    sheet={{ equipment } as CharacterSheet}
    say={() => undefined}
  />
);
```

Assert:

```ts
expect(markup.match(/class="worn-slot/g)).toHaveLength(11);
expect(markup).toContain("fallback rarity-common");
expect(markup).toContain('aria-label="Head: Unadorned Hood, Common.');
expect(markup).toContain('class="inventory-count"');
expect(markup).toContain(">15.8K<");
expect(markup).toContain("Gold pouch");
```

- [ ] **Step 2: Run component test and verify RED**

```bash
npm test -- src/components/tabs/EquipmentTab.test.tsx
```

Expected: FAIL because fallback classes and count-badge markup do not exist yet.

- [ ] **Step 3: Add the fallback treatment to the generalized slot renderer**

Confirm the exhaustive maps created in Task 5 contain these exact icon entries:

```ts
const SLOT_ICONS: Record<EquipmentSlot, IconComponent> = {
  Head: HelmetIcon,
  Cape: CapeIcon,
  Amulet: AmuletIcon,
  Ammo: ArrowsIcon,
  "Main hand": SwordIcon,
  Body: TorsoIcon,
  "Off hand": ShieldIcon,
  Legs: LegsIcon,
  Hands: GlovesIcon,
  Feet: BootsIcon,
  Ring: RingIcon
};
```

Confirm matching `SLOT_AREAS` entries exist and the renderer uses only
`sheet.equipment.items.map(...)`. Add `item.isFallback ? " fallback" : ""` to
the existing rarity class name. Keep the current tooltip and chat examine copy
for every item.

- [ ] **Step 4: Add typed backpack markup**

Each item button must render:

```tsx
<span className={`inventory-glyph kind-${item.kind}`} aria-hidden="true">
  {item.abbreviation}
</span>
<span className="inventory-count" aria-hidden="true">
  {formatStackCount(item.count)}
</span>
```

Use an exact accessible label and examine message:

```ts
aria-label={`${item.name}, ${item.count.toLocaleString("en")} — ${item.examine}`}
say("examine", `${item.name} (${item.count.toLocaleString("en")}): ${item.examine}`)
```

- [ ] **Step 5: Add fallback and badge styles**

Add `.worn-slot.fallback` with muted gray color and no glow. Add
`.inventory-count` as an absolutely positioned top-right compact badge with
high-contrast yellow text and black text shadow. Add kind classes for currency,
license, language, topic, archive, and template. Preserve the existing four
columns at <=560px and six columns only in the wider single-column layout.

- [ ] **Step 6: Verify component, full suite, and build**

```bash
npm test -- src/components/tabs/EquipmentTab.test.tsx
npm test
npm run build
git diff --check
```

Expected: all tests and build pass; no whitespace errors.

- [ ] **Step 7: Commit renderer and styling**

```bash
git add src/components/tabs/EquipmentTab.tsx src/components/tabs/EquipmentTab.test.tsx src/App.css
git commit -m "feat: render complete equipment inventory"
```

---

### Task 7: Browser acceptance and production release

**Files:**
- Verify only; modify the smallest relevant file only if a failing acceptance check reveals a defect.

**Interfaces:**
- Consumes: completed Tasks 1-6 and the existing `deploy-pages.yml` workflow.
- Produces: browser and production evidence for the released commit.

- [ ] **Step 1: Run fresh local release gates**

```bash
npm ci
npm test
npm run build
git diff --check
git status --short --branch
```

Expected: all tests pass, build succeeds, and only explicitly preserved user
changes remain outside the feature commits.

- [ ] **Step 2: Start the production build locally**

```bash
npm run preview -- --host 127.0.0.1 --port 5199
```

Use the browser-testing skill in a real Chromium browser. Open
`http://127.0.0.1:5199/character/ConalH`, wait for GitHub responses, and select
the equipment tab.

- [ ] **Step 3: Verify desktop and mobile acceptance**

At 1440x1000 and 390x844, verify:

- exactly 11 worn buttons;
- named fallback slots are muted but clickable;
- stack badges display compact counts;
- clicking a derived item and a fallback produces chat examine text;
- no horizontal page overflow;
- GitHub user/repository requests return 200; and
- console errors, warnings, page errors, and failed requests are all zero.

- [ ] **Step 4: Inspect the final commit series and protect user changes**

```bash
git log --oneline --decorate -8
git diff origin/main...HEAD --stat
git status --short
```

Expected: the feature diff contains only the planned source/test/spec files;
existing user-owned package and screenshot-tool changes are not staged.

- [ ] **Step 5: Push the implementation branch and merge through the chosen workflow**

```bash
git push -u origin HEAD
```

Open the PR with a body listing the seven release gates. Merge only after review
and green checks. A push to `main` must trigger `Deploy to Cloudflare Pages`.

- [ ] **Step 6: Monitor the automated deployment**

```bash
RUN_ID=$(gh run list --repo Conalh/github-adventurer-sheet --workflow deploy-pages.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$RUN_ID" --repo Conalh/github-adventurer-sheet --exit-status
```

Expected: Install, Test, Build, and Deploy steps all succeed with zero annotations.

- [ ] **Step 7: Verify Cloudflare and the canonical routes**

```bash
npx wrangler pages deployment list --project-name osrshub
curl -I https://osrshub.conalhickey.com/
curl -I https://osrshub.conalhickey.com/character/ConalH
```

Expected: newest production deployment matches the merged SHA; both canonical
URLs return `200 OK`. Repeat the equipment-tab browser smoke test against the
canonical hostname before declaring completion.

---

## Final Acceptance Checklist

- [ ] Existing five equipment slots preserve their prior behavior.
- [ ] Head, Body, Legs, Hands, Feet, and Ammo follow the approved derivation and fallback rules.
- [ ] Exactly 11 unique worn items are always returned and rendered.
- [ ] Backpack order is deterministic and capped at 28.
- [ ] Gold fixtures equal 0, 141, 15,794, and 6,993,251.
- [ ] Cache namespace is v5.
- [ ] No new GitHub calls or package dependencies exist.
- [ ] Unit, integration, static-render, build, browser, CI, Cloudflare, and canonical-host gates all pass.
- [ ] Unrelated user work remains untouched.
