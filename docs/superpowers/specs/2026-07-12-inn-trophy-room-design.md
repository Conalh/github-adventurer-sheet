# Inn Trophy Room Design

## Goal

Replace the outdoor character backdrop with a desktop-only guild inn that uses the existing scene area deliberately. The inn should make earned GitHub achievements visible as an accessible trophy wall while keeping the character portrait and nameplate as the focal point.

## Scope

This pass targets desktop presentation only. Mobile layout, mobile interaction design, and mobile acceptance testing are explicitly deferred to a separate pass.

The work includes:

- a cozy medieval inn combined with the prestige of an OSRS-style guild hall;
- a foreground-layer fix that prevents the worn cape from covering the nameplate;
- wall-mounted displays for every earned Skillcape;
- a compact set of GitHub-derived trophies;
- hover and keyboard-focus tooltips; and
- desktop layout and interaction tests.

It does not include locked-achievement silhouettes, new GitHub API requests, an achievement browser, user-selected equipment, or a mobile redesign.

## Visual Direction

The existing scene keeps its generous footprint, but dead air becomes useful scenery. The upper room combines stonework, guild banners, timber framing, cape hooks, plaques, and trophy shelves. The lower room uses floorboards and warm hearthlight. The character remains centered in front of the room, with the hearth offset so it supports rather than competes with the portrait.

The implementation uses layered CSS scenery and real React/HTML display elements. It does not use canvas or a fixed background illustration. This preserves the current pixel-art language while keeping achievements accessible, testable, and data-driven.

## Cape Collection

Every skill at level 99 awards its own Skillcape. The highest-scoring mastered skill determines the cape worn behind the portrait. Every earned cape, including the currently worn one, also appears on an individual wall hook. A profile with more than one mastery receives gold trim on the worn cape.

Cape displays expose the skill name, level, and mastery meaning in their tooltip. They are spaced as a collection rather than layered on the character.

## Trophy Model

The inn displays one earned trophy in each supported category. A trophy upgrades its material rather than leaving obsolete lower-tier copies on the wall. Materials follow the existing game vocabulary: bronze, silver, gold, runite, and legendary.

The categories are:

- **Star Relic:** total stars across original repositories.
- **Fellowship Standard:** follower count.
- **Forked Anvil:** total forks across original repositories.
- **Veteran's Plaque:** account age.
- **Steward's Lantern:** sustained repository stewardship that can be supported honestly by the already-fetched repository creation and update timestamps.

The five material thresholds, ordered bronze through legendary, are:

| Trophy | Bronze | Silver | Gold | Runite | Legendary |
| --- | ---: | ---: | ---: | ---: | ---: |
| Star Relic (original-repository stars) | 1 | 10 | 100 | 1,000 | 10,000 |
| Fellowship Standard (followers) | 10 | 100 | 1,000 | 10,000 | 100,000 |
| Forked Anvil (original-repository forks) | 1 | 10 | 100 | 1,000 | 10,000 |
| Veteran's Plaque (whole account years) | 1 | 3 | 5 | 10 | 15 |
| Steward's Lantern (qualifying repositories) | 1 | 3 | 10 | 25 | 50 |

A qualifying stewardship repository is original and non-archived, spans at least 365 days from creation to its latest push, and has been pushed within the 365 days preceding character generation. Invalid or missing timestamps do not qualify.

Thresholds are centralized in the domain layer and covered by boundary tests. Each tooltip states the trophy name, material tier, exact source metric, and why it was earned. The model uses only profile and repository data already fetched by the application, adding no API calls.

If a metric cannot be established from available data, its trophy is omitted. No locked, unavailable, or speculative display appears.

## Layout and Density

All earned distinct displays remain visible. Readability comes from semantic zones rather than an arbitrary item cap:

- Skillcapes hang from spaced hooks.
- Standards and plaques occupy upper-wall positions.
- dimensional relics, anvils, and lanterns sit on shelves.

Zones use consistent gaps and may grow vertically for exceptional profiles. Sparse profiles produce a quieter but still intentional inn. Celebrity-scale profiles may produce a larger wall, but items must never overlap or collapse into an unreadable cluster at the supported desktop viewport.

## Interaction and Accessibility

Every wall item is a focusable interactive display. Pointer hover and keyboard focus reveal the same compact tooltip. The tooltip contains the item name, tier, source metric, and unlock explanation. It remains within the desktop viewport and does not navigate away.

Decorative inn layers remain hidden from assistive technology. Achievement content uses meaningful labels and does not depend on color alone. The nameplate is explicitly positioned above the cape layer so the cape can never obscure the profile name or level.

## Data Flow and Boundaries

Achievement derivation belongs in the character domain module, not in rendering components. It receives the existing normalized profile and repository data and returns typed wall-display records. The viewport consumes those records and decides only how to render them in the inn's visual zones.

The main units are:

- domain helpers for mastered skills, trophy tiers, and earned wall displays;
- a typed wall-display model with category, tier, label, evidence, and placement zone;
- focused inn wall and tooltip components; and
- CSS scenery and desktop layout rules.

No new remote dependency or request path is introduced.

## Failure Behavior

Missing optional repository metrics omit only the affected trophy. Missing avatar data continues to use the existing avatar fallback. An empty achievement set still renders the inn and portrait without placeholder trophies. Tooltip failures must not affect the underlying character sheet.

## Verification

Implementation follows test-driven development. Automated tests will cover:

- the foreground nameplate rule that fixes cape overlap;
- one cape record for every level-99 skill;
- deterministic selection and trimming of the worn cape;
- trophy threshold boundaries and upgrades;
- sparse profiles, profiles with missing optional data, and celebrity-scale profiles;
- exact tooltip evidence and keyboard focusability; and
- a supported desktop viewport with no overlapping displays or horizontal overflow.

The full unit suite and production build must pass. Final acceptance uses a real desktop browser against the local build and, after merge, the canonical production domain. Mobile verification is excluded from this pass.
