# Top-Down OSRS Inn Design

## Goal

Move the desktop character scene substantially closer to the supplied Old School RuneScape inn reference while preserving the GitHub portrait as the character's visual identity. The room should read immediately as a top-down timber inn, and earned Skillcapes should look like recognizable garments rather than flat colored markers.

## Scope

This pass changes the desktop scene presentation only. It includes the inn composition, scenery, portrait placement, cape artwork, wall-display placement, and desktop interaction verification.

It does not redesign the sidebar, tabs, chatbox, character formulas, trophy thresholds, GitHub data fetching, or mobile layout. Mobile remains deferred.

## Chosen Approach

Use a CSS and SVG hybrid:

- semantic HTML and CSS construct the room, furniture, depth, and layout;
- a reusable inline SVG component renders Skillcapes with skill-specific colors and emblems; and
- existing React display records continue to drive earned capes and trophies.

This approach keeps the scene responsive within the supported desktop area, preserves accessible interactions, and gives capes enough illustrative detail without introducing a canvas renderer or fixed background image.

## Room Composition

The playspace becomes a top-down room rather than a front-facing wall. Its dominant surface is a dark timber-plank floor with visible horizontal courses and restrained variation between boards. Partial timber-and-plaster wall edges frame the top and sides, establishing the viewing angle without enclosing the content.

A long crimson rug with gold edging runs vertically through the center. The GitHub portrait sits over the upper-middle portion of the rug as the profile's character representation. It remains front-facing and legible, but its frame, shadow, and placement integrate it into the room rather than reading as a photograph pasted onto a wall.

Furniture surrounds the rug asymmetrically in the manner of the reference:

- rectangular tables occupy the upper-left and upper-right floor areas;
- stools or small chairs accompany the tables without crossing the central route;
- a bar or serving counter anchors one lower edge; and
- a compact hearth or warm light source occupies a side edge.

Furniture is deliberately sparse enough to keep the portrait, nameplate, and wall displays readable. The scene uses hard-edged pixel-style shapes, limited shading, and small ambient details rather than smooth modern illustration.

## Portrait and Character Information

The GitHub avatar remains the primary character image. It is centered over the rug and sized close to the current portrait so identity is not sacrificed for environmental accuracy.

The overhead text remains above the portrait. The nameplate and class line sit directly below it in the central aisle. Their foreground layer remains higher than the worn cape, room furniture, and rug so no decorative element can obscure the profile name or level.

The worn cape remains behind the portrait as a prestige silhouette. It must use the same improved cape geometry as the wall collection while being cropped and layered to read as something worn behind the avatar.

## Skillcape Artwork

Replace the current trapezoids with a reusable `SkillcapeArt` SVG component. Each cape contains:

- dark shoulder horns or clasps;
- a shaped shoulder mantle and narrow neck opening;
- a long tapered fabric body with a slightly uneven lower edge;
- darker side panels and inner shadows that imply folds;
- contrasting trim, including gold trim for mastered or trimmed states; and
- a centered, recognizable emblem for the associated skill.

The component accepts the skill, size, and trim state. Skill colors and emblem definitions remain centralized rather than duplicated in CSS selectors. Emblems may be simplified to suit the small display size, but each supported skill must have a distinct silhouette and accessible skill label.

Wall capes hang individually from rails or pegs along the room's upper and side boundaries. They use the same component at a smaller size and retain their existing hover and keyboard-focus tooltips. A profile with many mastered skills wraps capes across defined rails; it must not collapse them into overlapping wedges.

## Trophies and Room Displays

Existing trophy records, tiers, evidence, and tooltips remain unchanged. Their presentation moves from a single front-facing trophy wall into the room:

- capes use wall rails;
- standards and plaques use upper wall positions;
- dimensional trophies use shelves, side tables, or counter surfaces; and
- the hearth stays decorative and non-interactive.

All displays remain visible for a celebrity-scale profile such as Torvalds. Placement uses explicit semantic zones with predictable wrapping. Decorative furniture may yield space to earned displays, but earned displays are never hidden or capped.

## Visual Depth and Layering

The scene uses a small, explicit stacking model:

1. floor and rug;
2. wall edges and fixed room scenery;
3. furniture and achievement displays;
4. worn cape;
5. portrait;
6. overhead text, nameplate, and class line;
7. context menus and tooltips.

Top-down depth comes from overlap, shortened vertical dimensions, dark contact shadows, and consistent object orientation. The design avoids strong perspective transforms that would distort text or interactive hit targets.

## Interaction and Accessibility

The portrait retains its existing click menu. Every earned cape and trophy remains a native focusable control. Hover and keyboard focus reveal the same tooltip, and tooltips stay above all room scenery.

Decorative room elements remain hidden from assistive technology and ignore pointer events. Cape emblems do not replace textual names; accessible labels and tooltip copy continue to identify each achievement independently of color or symbol recognition.

## Responsive Boundary

The supported target is desktop at 941 pixels and wider. The room should be composed and tested at 1440 by 1000, with a reasonable fit down to the existing desktop breakpoint. This pass may preserve the existing smaller-screen fallback without attempting to make the new composition ideal on mobile.

## Failure Behavior

Missing avatar data continues to use the initials fallback. A profile without Skillcapes renders no wall capes and no worn cape, while the inn still looks intentional. Missing trophy metrics omit only the affected trophies. Unknown skill artwork falls back to a neutral cape with a generic emblem rather than breaking the scene.

## Verification

Implementation follows test-driven development. Automated coverage must verify:

- each supported skill maps to distinct cape artwork metadata;
- trimmed and untrimmed cape states are deterministic;
- every earned cape still produces one focusable wall display;
- worn cape, portrait, and nameplate stacking cannot regress;
- Torvalds-scale display data has no overlaps or horizontal overflow at the supported desktop viewport; and
- portrait menu and display tooltips still work by mouse and keyboard.

The full unit suite and production build must pass. Final acceptance uses a real desktop browser first against the local production build and then against `https://osrshub.conalhickey.com/` after deployment. Acceptance includes screenshots at 1440 by 1000, console and network checks, tooltip interaction, and comparison against the supplied top-down inn and Skillcape references.
