# Inventory Expansion Design

## Summary

GitHub Adventurer Sheet currently displays the full 11-slot worn-equipment
layout but can only populate five slots. The remaining six are permanent empty
silhouettes, and the backpack is limited to six untyped language/topic strings.

This change will derive honest, deterministic items for all 11 worn slots and
expand the backpack into a typed, count-bearing inventory. It will use only the
two GitHub REST responses the application already fetches. Missing signals will
produce named, muted Common fallback items rather than empty, non-interactive
slots.

## Goals

- Populate every worn slot from existing GitHub profile and repository data.
- Make every slot, including fallbacks, examinable through the existing chatbox.
- Expand the backpack to at most 28 meaningful, data-backed item stacks.
- Represent reputation as a gold stack derived multiplicatively from followers
  and stars.
- Preserve deterministic output: the same payload and evaluation time must
  produce the same equipment and backpack.
- Preserve the current no-login, browser-only, no-extra-request architecture.

## Non-goals

- Adding GitHub API requests for releases, commits, contributors, or gists.
- Adding authentication or a server-side GitHub token proxy.
- Rebalancing skills, achievements, prestige, or the existing five equipment
  slots.
- Adding decorative junk items solely to fill backpack capacity.
- Building a generic configuration-driven item engine.
- Adding item navigation or changing the current repository-link behavior.

## Approved Product Decisions

- Head uses the dominant topic; Feet uses the number of unique topics. These
  signals are related but communicate different ideas: specialization versus
  breadth.
- Missing signals render as named gray Common items, not dim empty silhouettes.
- Backpack items display game-style stack badges.
- Reputation gold has no starter grant. A profile with no followers or no stars
  has zero gold.
- Implementation uses a focused equipment domain module rather than expanding
  `githubCharacter.ts` or introducing a generalized item system.

## Architecture

### `src/lib/equipment.ts`

Create a pure domain module that owns:

- equipment and backpack types;
- the canonical 11-slot order;
- all worn-item builders and fallback builders;
- new and existing equipment rarity helpers;
- backpack construction, ordering, and capacity enforcement;
- reputation-gold calculation; and
- compact stack-count formatting.

The module accepts a structural `EquipmentInput` rather than importing from
`githubCharacter.ts`. This prevents a circular dependency and keeps it usable in
isolated unit tests.

Conceptually, the input contains:

```ts
type EquipmentInput = {
  user: {
    followers: number;
    publicGists: number;
  };
  repos: EquipmentRepoInput[];
  accountAgeYears: number;
  languageCounts: CountedName[];
  topicCounts: CountedName[];
  now: Date;
  prestige: {
    capeSkill: string | null;
    trimmed: boolean;
  };
};
```

`EquipmentRepoInput` contains only the fields needed by equipment derivation.
It does not duplicate the entire GitHub repository response.

### `src/lib/githubCharacter.ts`

This module remains responsible for API types, fetching, character metrics,
skills, quests, prestige, and complete sheet assembly. It will:

- retain the additional response fields described below;
- pass normalized structural inputs to `buildEquipment()`; and
- import `CharacterEquipment` for the `CharacterSheet` type.

The cache key changes from `github-character:v4:<username>` to
`github-character:v5:<username>` so cached `backpack: string[]` records cannot
enter the new renderer.

### `src/components/tabs/EquipmentTab.tsx`

The component becomes a renderer of the complete equipment model:

- one icon and grid-area map covers all 11 `EquipmentSlot` values;
- the hard-coded `EMPTY_SLOTS` collection is removed;
- every worn item renders as a button with tooltip, accessible label, and
  chatbox examine action;
- `isFallback` controls the muted fallback treatment independently from rarity;
  and
- typed backpack items render their abbreviation, kind styling, and compact
  count badge.

### `src/App.css`

Add only the styles required for:

- named fallback slots;
- backpack item kinds;
- stack-count badges; and
- the expanded four-column inventory at existing responsive breakpoints.

The existing worn-equipment grid geometry and icons remain unchanged.

## Domain Model

```ts
type EquipmentSlot =
  | "Head"
  | "Cape"
  | "Amulet"
  | "Ammo"
  | "Main hand"
  | "Body"
  | "Off hand"
  | "Legs"
  | "Hands"
  | "Feet"
  | "Ring";

type EquipmentItem = {
  slot: EquipmentSlot;
  name: string;
  detail: string;
  rarity: Rarity;
  isFallback: boolean;
  href?: string;
};

type BackpackItemKind =
  | "currency"
  | "license"
  | "language"
  | "topic"
  | "archive"
  | "template";

type BackpackItem = {
  id: string;
  kind: BackpackItemKind;
  name: string;
  abbreviation: string;
  count: number;
  examine: string;
};

type CharacterEquipment = {
  items: EquipmentItem[];
  backpack: BackpackItem[];
};
```

`items` always contains exactly one entry for each canonical slot. Backpack IDs
include the kind, such as `language:go` and `topic:go`, so semantically distinct
stacks do not collide.

## Additional GitHub Response Fields

No endpoints are added. Extend the retained API types with fields already
returned by the existing requests.

User:

- `public_gists`

Repository:

- `size` in kilobytes;
- `open_issues_count`;
- `created_at`;
- `pushed_at`;
- `license?: { spdx_id: string | null } | null`; and
- `is_template`.

Do not retain unused candidate fields such as `hireable`, `twitter_username`,
or `has_pages`.

## Worn-Equipment Rules

The existing Main hand, Off hand, Cape, Amulet, and Ring behavior remains the
same except that their fallback objects receive `isFallback: true`; derived
objects receive `isFallback: false`.

### Head

- Derived item: `Helm of <top topic>`.
- Signal: highest topic count; count/name ordering already makes ties stable.
- Detail: `Their declared field of study (used on N quests)`.
- Rarity thresholds: 2, 4, 8, and 15 uses.
- Fallback: `Unadorned Hood` / `No field of study declared`.
- A single topic use produces a derived Common helm.

### Body

- Derived item: `Breastplate of <largest repo>`.
- Signal: highest positive repository `size`.
- Detail: human-readable bytes followed by `of hammered code`.
- Rarity thresholds in MB: 1, 10, 100, and 1,000.
- Fallback: `Cloth Tunic` / `Travelling light`.
- Repository ties resolve by `full_name` alphabetically.

### Legs

- Derived item: `Greaves of <longest-maintained repo>`.
- Signal: largest positive span from valid `created_at` to `pushed_at`.
- Negative, zero, or invalid spans do not qualify.
- Detail: below one year, use `max(1, floor(days / 30.4375))` whole months;
  from one year onward, use `floor(days / 365.25)` whole years.
- Rarity uses elapsed days divided by 365.25, with thresholds of 1, 3, 6, and
  10 years.
- Fallback: `Patched Trousers` / `Every journey starts somewhere`.
- Repository ties resolve by `full_name` alphabetically.

### Hands

- Derived item: `Gauntlets of <busiest tracker repo>`.
- Signal: highest positive `open_issues_count`.
- Detail explicitly says `open issues & pull requests` because GitHub includes
  pull requests in this count.
- Rarity thresholds: 5, 20, 100, and 500.
- Fallback: `Bare Hands` / `No open quarrels`.
- Repository ties resolve by `full_name` alphabetically.

### Feet

- Derived item: `Boots of Wandering`.
- Signal: total unique topic count.
- Detail: `Trodden through N topics`.
- Rarity thresholds: 3, 8, 15, and 30.
- Fallback: `Barefoot` / `The grass is soft here`.
- One or two unique topics produce derived Common boots.

### Ammo

- Derived item: `Quiver of Gists`.
- Signal: positive `public_gists` count from the existing user response.
- Detail: `N snippets nocked and loosed`.
- Rarity thresholds: 1, 10, 30, and 100.
- Fallback: `Empty Quiver` / `No gists loosed`.

## Reputation Gold

Gold rewards the interaction of audience and project acclaim. Stars are summed
only across non-fork repositories in the fetched set, preserving the existing
300-repository request cap.

```text
reputation = sqrt(followers * originalRepoStars)

gold = round(
  50 * reputation
  -------------------------
  1 + reputation / 280,000
)
```

Properties:

- zero followers or zero stars produces zero gold;
- the curve is approximately linear for ordinary accounts;
- the denominator introduces a soft ceiling of 14 million; and
- the fixed calibration places Torvalds near seven million without allowing
  celebrity profiles to produce billions.

Locked fixture anchors:

| Fixture | Followers | Original-repo stars | Gold |
| --- | ---: | ---: | ---: |
| Empty | 0 | 0 | 0 |
| ConalH calibration | 4 | 2 | 141 |
| Active normal | 200 | 500 | 15,794 |
| Torvalds calibration | 311,435 | 250,769 | 6,993,251 |

These are deterministic test fixtures, not live assertions against GitHub.

## Backpack Rules

The backpack contains at most 28 real items. It is not padded with decorative
junk or serialized empty placeholders.

Priority groups:

1. Gold pouch, always present, including at zero.
2. License stacks.
3. Language and topic stacks.
4. Archived-repository stack when positive.
5. Template-stamp stack when positive.

Within a group, stacks sort by count descending and then name ascending.
Language wins the kind-order tie before topic, but `language:go` and `topic:go`
remain separate stacks because one counts repositories and the other counts
topic declarations.

License behavior:

- Group case-insensitively by trimmed SPDX ID.
- Omit null, empty, and `NOASSERTION` values.
- Use familiar themed names for common IDs (`MIT Scroll`, `GPL Grimoire`,
  `Apache Writ`, `Unlicense Talisman`).
- Use `<SPDX ID> Scroll` as the deterministic fallback name for other valid
  IDs.
- The stack count is the number of fetched repositories declaring that license.

Other stacks:

- Languages use their existing repository counts.
- Topics use their existing declaration counts.
- Archives form one `Dusty Tomes` stack.
- Templates form one `Template Stamps` stack.

After concatenating groups in priority order, slice the array to 28 items.

## Stack Labels and Examine Text

Use `Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })`
so badge output is locale-stable and has at most one fractional digit:

- 141 -> `141`
- 1,000 -> `1K`
- 15,794 -> `15.8K`
- 1,000,000 -> `1M`
- 6,993,251 -> `7M`

The badge is compact; the tooltip, accessible label, and chatbox examine text
always use the exact localized count. The item model stores the numeric count,
not the compact label.

## Input Normalization and Determinism

Treat GitHub response content as untrusted data before derivation:

- non-finite values normalize to zero; finite counts normalize with
  `max(0, trunc(value))`;
- invalid date values normalize to no usable span;
- a pushed date earlier than its created date does not qualify for Legs;
- null, empty, and `NOASSERTION` license values do not produce license items;
- repository selectors compare the numeric signal first and `full_name`
  alphabetically second; and
- backpack ordering never depends on `Map` insertion order or API response
  order.

Missing signals never fail character-sheet calculation. Each worn slot has a
defined fallback, and optional backpack groups are simply omitted.

Network, not-found, and GitHub rate-limit errors continue through the existing
application error states without equipment-specific handling.

## Rendering and Accessibility

- All 11 worn slots are native buttons.
- Accessible labels include slot, item name, rarity, and detail.
- Fallbacks remain Common but receive a dedicated muted visual class.
- Derived Common items are not visually confused with fallbacks.
- Epic and Legendary glow behavior remains limited to derived items.
- Backpack entries remain list items containing native buttons.
- Badge text is supplemental; exact quantities remain available to assistive
  technology and in examine text.
- The grid remains four columns on narrow screens and must not introduce
  horizontal page overflow at a 390-pixel viewport.

## Testing Strategy

### Equipment-domain unit tests

Create `src/lib/equipment.test.ts` with table-driven coverage for:

- all six new derived items and fallbacks;
- the existing five items after extraction;
- each rarity threshold immediately below and at the boundary;
- body-size conversion;
- valid, invalid, zero, and backwards maintenance spans;
- issue-count wording;
- repository tie-breaking;
- license normalization and grouping;
- language/topic separation;
- backpack priority and the 28-item cap;
- compact count formatting boundaries; and
- all locked gold calibration fixtures.

### Character-sheet integration tests

Update API fixtures with safe defaults for the newly retained fields. Assert
that complete sheet calculation returns:

- exactly 11 equipment items;
- every slot exactly once;
- the new typed backpack shape; and
- honest all-fallback behavior for an empty profile.

### Component rendering test

Add a server-rendered `EquipmentTab` test using `react-dom/server`, which is
already available. Verify:

- all 11 slot buttons;
- fallback classes and accessible labels;
- backpack stack badges; and
- exact examine metadata in the rendered output.

This avoids adding a browser-test dependency merely for static component
structure.

### Release verification

Before completion:

1. Run the complete Vitest suite.
2. Run the TypeScript/Vite production build.
3. Inspect the equipment tab in a real browser at desktop and 390-pixel mobile
   widths.
4. Verify all 11 slots can produce chatbox examine messages.
5. Confirm no console errors, failed requests, or horizontal overflow.
6. Push through the existing automatic `main` deployment workflow.
7. Confirm the successful Cloudflare deployment matches the released commit.
8. Verify the canonical homepage and a direct `/character/<username>` route.

## Expected Files

- `src/lib/equipment.ts` (new)
- `src/lib/equipment.test.ts` (new)
- `src/lib/githubCharacter.ts`
- `src/lib/githubCharacter.test.ts`
- `src/components/tabs/EquipmentTab.tsx`
- `src/components/tabs/EquipmentTab.test.tsx` (new)
- `src/App.css`

No other production modules should need changes.
