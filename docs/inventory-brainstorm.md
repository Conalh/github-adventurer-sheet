# Inventory brainstorm — filling all 11 worn slots (and the backpack)

Status: brainstorm / design doc. Nothing here is implemented yet.

## Where we are

The worn-equipment cross has the full 11 slots of the classic layout, but
only 5 are ever filled:

| Slot      | Item                              | Signal                    |
| --------- | --------------------------------- | ------------------------- |
| Weapon    | Blade of `<most starred repo>`    | stars                     |
| Shield    | Aegis of `<most forked repo>`     | forks received            |
| Cape      | Skillcape (99) / account-age cape | prestige or account age   |
| Neck      | `<language>` Amulet               | dominant language         |
| Ring      | Signet of `<most recent repo>`    | recency                   |
| **Head**  | — always empty —                  |                           |
| **Body**  | — always empty —                  |                           |
| **Legs**  | — always empty —                  |                           |
| **Hands** | — always empty —                  |                           |
| **Feet**  | — always empty —                  |                           |
| **Ammo**  | — always empty —                  |                           |

Empty slots read as "unfinished" rather than "aspirational" because nothing
a player does can ever fill them.

## Constraints

- **No new API calls.** We already fetch `users/{u}` and up to 300 repos.
  Both payloads carry fields we currently throw away:
  - user: `public_gists`, `hireable`, `twitter_username`
  - repo: `size` (KB), `open_issues_count`, `created_at`, `pushed_at`,
    `license.spdx_id`, `has_pages`, `is_template`
- **Deterministic.** Same profile → same loadout, like everything else.
- **Every slot needs a fallback** ("Bare head", etc.) so empty profiles
  still render honestly — but with these signals, almost any real account
  fills most slots.
- **Slot metaphors should feel earned**, not arbitrary: the joke lands when
  the mapping makes a kind of sense.

## Slot-by-slot options

### Head — "what you think with"

1. **Helm of `<top topic>`** *(recommended)* — the most-used repo topic is
   literally the field of study declared on their banner.
   `Helm of ai-agents · "Their declared field of study (used on 7 quests)"`.
   Rarity by topic usage count: 2 / 4 / 8 / 15.
   Fallback: `Unadorned Hood — no field of study declared`.
2. Scholar's Circlet from `public_gists` (better spent on Ammo, below).
3. Crown by follower count (clashes with the prestige crown — skip).

### Body — "the weight you carry"

1. **Breastplate of `<largest repo by size>`** *(recommended)* — `size` is
   literal weight in KB; heavy codebase = heavy armor. Detail renders the
   size: `"48 MB of hammered code"`. Rarity by MB: 1 / 10 / 100 / 1000.
   The kernel would be Legendary plate, as it should be.
   Fallback: `Cloth Tunic — travelling light`.
2. Chainmail of N original repos (duplicates the Attack skill signal).

### Legs — "endurance"

1. **Greaves of `<longest-maintained repo>`** *(recommended)* — widest
   `created_at → pushed_at` span. Nothing says endurance like a repo
   maintained for 15 years. Detail: `"Maintained for 15 years"`.
   Rarity by span: 1 / 3 / 6 / 10 years.
   Fallback: `Patched Trousers — every journey starts somewhere`.
2. Legs by total repo count (already Mining's signal).

### Hands — "what you grapple with"

1. **Gauntlets of `<repo with most open issues>`** *(recommended)* —
   issues are gauntlets thrown down; maintaining a busy tracker is
   hand-to-hand combat. Detail: `"Grappling 214 open issues"`.
   Rarity: 5 / 20 / 100 / 500.
   Fallback: `Bare Hands — no open quarrels`.
   Caveat: `open_issues_count` includes PRs (GitHub quirk) — acceptable
   for flavor; the detail line can say "open issues & pull requests".
2. Tinker's Gloves from forks-made (weak flavor).

### Feet — "where you've wandered"

1. **Boots of Wandering** *(recommended)* — distance travelled =
   `uniqueTopics` trodden. Detail: `"Trodden through 23 topics"`.
   Rarity: 3 / 8 / 15 / 30. Generic item (no repo link) — that's fine,
   boots are boots.
   Fallback: `Barefoot — the grass is soft here`.
2. Boots from `has_pages`/homepage count ("journeys published") — decent
   alternate if topics feel doubled-up with the Head helm. Mitigation if
   both stay: Head uses the single top topic, Feet uses the count of all
   topics; different numbers, different flavor.

### Ammo — "small things you fire off"

1. **Quiver of Gists** *(recommended)* — gists are snippets loosed into
   the world; `public_gists` is already in the user payload. Detail:
   `"137 snippets nocked and loosed"`. Rarity: 1 / 10 / 30 / 100.
   Fallback: `Empty Quiver — no gists loosed`.
2. Releases as cannonballs (needs an extra API call per repo — violates
   the no-new-calls constraint; shelve for a token-backed future).

## Backpack expansion (the 4×N grid)

Currently up to 6 tiles of languages+topics. The classic inventory is
4×7 = 28 slots; filling more of it makes the tab feel like a real bag.
Candidate items, in priority order, capped at 28:

1. **Coin pouch** — followers as gold pieces: a tile reading `311k` in
   coin-yellow. Examine: `"A pouch holding 311,359 gold followers."`
   (Every player understands a coin stack instantly.)
2. **License scrolls** — distinct `license.spdx_id` values across repos
   become items: `MIT Scroll`, `GPL Grimoire`, `Apache Writ`,
   `Unlicense Talisman`. Examine explains which licenses they ship under.
3. **Languages & topics** (existing tiles, keep, deduped).
4. **Dusty tomes** — `archivedRepos` count as one stack item:
   `"3 sealed archives, humming faintly."`
5. **Template stamps** — `is_template` repos: `"A seal for stamping new
   quests."`
6. Junk drawer flavor (only if slots remain): `Old boot`, `Casket`,
   `Burnt lobster` — pure decoration, zero data. Probably skip: every
   item should mean something here.

## Implementation sketch (when we build it)

- Extend `GitHubRepo` type: `size`, `open_issues_count`, `created_at`,
  `pushed_at`, `license?: { spdx_id: string | null } | null`.
  Extend `GitHubUser`: `public_gists`.
- `EquipmentSlot` union grows to 11; `getEquipment` fills all slots with
  the recommendations above; worn-grid empty-state rendering becomes the
  fallback-item rendering (silhouette + gray name still works for true
  fallbacks).
- Rarity helpers per slot with tests, same pattern as the existing five.
- Backpack becomes `BackpackItem[] { name, kind, count, examine }` so
  tiles can render count badges (coin pouch shows `311k`).
- Cache bump to v5 (sheet shape changes).
- Tooltips and click-examine already generalize.

## Open questions

1. Head vs Feet both leaning on topics — keep both (top-topic vs count),
   or move Feet to homepage-count "Voyager's Boots"?
2. Should fallback items render as dim silhouettes (current empty style)
   or as named gray "Common" items? Named-gray makes the tab feel fuller
   and gives everyone something to examine. (Leaning: named-gray.)
3. Coin pouch: followers or stars as the currency? Followers reads as
   "gold earned from the crowd"; stars are already the Blade's glory.
   (Leaning: followers.)
4. Does the backpack keep its flat 2-letter tiles, or add count badges
   in the corner like item stacks? (Leaning: count badges — very game.)
