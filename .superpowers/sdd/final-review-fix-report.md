# Final Review Fix Report

## Scope

- Base: `578a8f0 docs: review inventory before release`
- Production/test changes: `src/lib/equipment.ts`, `src/lib/equipment.test.ts`
- No API, UI, package, dependency, or unrelated source changes.
- Compatibility restored for Main hand, Off hand, and Ring selectors while Body,
  Legs, and Hands retain alphabetical `fullName` tie-breaking.

## RED

Command run before any production change:

```text
npm test -- src/lib/equipment.test.ts
```

Result: exit 1; 1 test file failed; 3 tests failed and 72 passed (75 total).
The failures were the expected compatibility regressions:

```text
Main hand: expected "Blade of zeta", received "Blade of alpha"
Off hand: expected "Aegis of zeta", received "Aegis of alpha"
Ring: expected "Signet of zeta", received "Signet of alpha"
```

All newly added threshold, Body-size, and Legs-duration coverage passed during
RED. The failure cause was the shared alphabetical repository selector.

## Minimal implementation

Added a stable legacy repository selector that preserves input/API order for
complete ties. Main hand and Off hand use `updatedAt` descending as their
secondary comparison. Ring uses only `updatedAt`, preserving API order when
timestamps tie. The existing alphabetical selector remains unchanged for Body,
Legs, and Hands.

## GREEN

Focused command after the implementation change:

```text
npm test -- src/lib/equipment.test.ts
```

Result: exit 0; 1 test file passed; 75 tests passed (75 total); duration 496 ms.

## Full verification

```text
npm test
```

Result: exit 0; 3 test files passed; 102 tests passed (102 total); duration 593 ms.

```text
npm run build
```

Result: exit 0; `tsc --noEmit` passed; Vite 7.3.6 transformed 46 modules and
built successfully in 712 ms.

```text
git diff --check
```

Result: exit 0 with no whitespace errors. Git emitted only the repository's
LF-to-CRLF working-copy warnings for the two modified source files.

## Self-review

- Confirmed every requested threshold and immediately-below boundary is covered
  for Head, Body, Legs, Hands, Feet, and Ammo.
- Confirmed 1023 KB remains Common with KB detail and 1024 KB becomes Uncommon
  with MB detail.
- Confirmed sub-year Legs detail uses whole months, one year onward uses whole
  years, and rarity continues to receive elapsed fractional years.
- Confirmed the selector change is isolated to the three legacy
  repository-derived slots and does not change the alphabetical new-slot path.
- Confirmed the source diff is limited to the two authorized files.

## Concerns

None.
# Final review wave: cache, wall occlusion, trophy boundaries, and inn copy

## RED evidence

- Focused Vitest run (`npm test -- src/lib/githubCharacter.test.ts src/components/Viewport.test.tsx src/lib/trophyRoom.test.ts`) failed as intended with 3 regressions: the key remained `github-character:v5:ConalH`, the unexpired stale v5 record returned `stale-v5`, and the source lacked the inn walk message. Trophy boundary additions passed against current behavior.
- Desktop acceptance (`node .superpowers/sdd/inn-desktop-acceptance.mjs`, 1440x1000) failed as intended: `cape:Prayer` intersected `.player-portrait`. The first narrower-column attempt remained RED (`cape:Prayer` and `trophy:stars` intersected), proving that width alone did not reserve the center.

## Fixes

- Bumped the character cache namespace from v5 to v6. The regression seeds an unexpired v5-shaped localStorage record without `trophyRoom`, confirms fresh GitHub-derived data is returned, then confirms the new v6 record retains normal in-memory cache behavior without extra fetches.
- Reserved explicit desktop left/right display columns outside the portrait footprint. No wall display is dropped.
- Added table-driven threshold-1/exact-threshold coverage for all five materials across stars, followers, forks, veteran years, and stewardship repositories. Added isolated exact-365-day stewardship lifespan/freshness coverage and future-push rejection.
- Replaced meadow copy with: `You cross to the other side of the inn. The commit history follows you.` and added a focused source regression.
- Extended the ignored desktop harness with `.player-portrait` intersection evidence. A development StrictMode request aborted before an identical URL completed successfully; the harness records it but treats it as resolved only when that exact URL also returns HTTP 200. Unresolved request failures still fail acceptance.

## GREEN verification

- Focused tests: 3 files passed, 63 tests passed.
- Full `npm test`: 6 files passed, 143 tests passed.
- `npm run build`: TypeScript and Vite production build passed; 48 modules transformed.
- `git diff --check`: exit 0 (Git emitted only configured LF-to-CRLF working-copy notices).
- Desktop acceptance at 1440x1000: passed; 8/8 visible and unique displays; zero pair overlaps; zero portrait occlusions; zero horizontal overflow; nameplate z-index 5 above cape z-index 0; focus and hover tooltips visible; GitHub user and repository responses HTTP 200; zero console errors; zero page errors; zero unresolved failed requests.
- Browser geometry: portrait x=475..695; left displays ended at x=450.5; right displays began at x=719.5, leaving clear separation on both sides.

## Self-review and concerns

- Reviewed the complete diff for scope, cache isolation, boundary intent, layout preservation, and harness failure semantics.
- No production dependencies or API calls were added. The approved plan/spec were not edited. Nothing was pushed or deployed.
- The desktop exclusion rule intentionally applies only above 940px, matching the requested desktop acceptance surface and preserving existing responsive behavior.
- No remaining correctness concern found. The recorded, resolved `net::ERR_ABORTED` is React development StrictMode cancellation; the corresponding GitHub URL completed with 200 and unresolved failures remain fatal.
