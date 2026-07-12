# Inn Component and Character Text Visual Polish Design

## Goal

Replace the inn's flat placeholder-like furniture with coherent top-down pixel-art components and eliminate the remaining text collisions around the portrait. The scene should retain its current footprint and dynamic achievement behavior while reading as one deliberately illustrated room.

## Scope

This pass covers:

- floorboards, wall framing, tables, benches or stools, central counter, fireplace, and small room details;
- the empty and populated cape-rail presentation;
- overhead text, nameplate, class line, and status-orb layout; and
- desktop acceptance at the existing 941px and 1440px targets.

It does not change GitHub data, character formulas, equipment contents, trophy thresholds, portrait size, tabs, chatbox, or the mobile layout. Skillcape and trophy artwork remain unchanged except for how their rails and shelves integrate with the room.

## Chosen Approach

Use a CSS and inline-SVG hybrid. `InnRoom` remains one decorative, assistive-technology-hidden boundary, but its major furnishings become small focused React components with explicit SVG geometry:

- `InnWallFrame` renders the north beam and side posts;
- `InnTable` renders left and right table groups with a tabletop and seating;
- `InnCounter` renders the foreground serving counter; and
- `InnHearth` renders the fireplace and contained flame.

CSS owns placement, scaling, color variables, contact shadows, and the floor. SVG owns silhouettes, bevels, planks, stone courses, legs, stools, and firebox geometry. No raster asset, canvas renderer, generated background, or new dependency is introduced.

## Shared Visual Language

All room components use the same top-left light direction and three-value material system: highlight, midtone, and shadow. Contact shadows fall down and right. Outlines are dark brown rather than pure black, and major forms use hard-edged shapes without smooth modern gradients.

Wood uses warm brown top planes, dark end grain, visible plank seams, occasional knots, and narrow highlight edges. Stone uses irregular block courses in muted gray-brown tones. Metal details are sparse and desaturated. Fire provides the only strong orange-yellow glow.

The floor uses staggered horizontal plank courses instead of an uninterrupted repeating grid. Seams offset every other row, and a restrained set of knots and nail marks breaks repetition without becoming noisy.

## Furniture Components

### Tables and Seating

Each side table reads from above. It has a clear tabletop slab, perimeter bevel, three or four plank divisions, short visible leg corners, and a compact contact shadow. Seating reads as benches or square stools aligned with the table rather than as circular cart wheels. Left and right groups may mirror placement but retain identical lighting.

Tables remain outside the portrait, achievement zones, and central rug. Their details scale down at the 941px desktop boundary without collapsing into solid rectangles.

### Foreground Counter

The counter becomes a serving bar seen from above, with a lighter top slab, darker front fascia, panel divisions, corner posts, and a consistent shadow. It remains centered below the rug and does not cover the status or identity stack.

### Fireplace

The fireplace becomes a recognizable masonry object rather than a gray rectangle. It includes:

- an irregular stone surround with visible block courses;
- a heavy wooden or stone mantle;
- a recessed, dark arched firebox;
- two small logs or coals;
- a layered flame with yellow core, orange body, and red base; and
- restrained light on the inner stones plus a soft floor-facing glow.

The fire stays contained within the opening. No part of the mantle, surround, or flame may visually merge with the adjacent table.

## Walls and Room Details

The north wall and side posts gain bevels, timber joints, and small metal pegs. The rug retains its red-and-gold identity but receives a woven inner border and less geometric center mark. Small room details are limited to a few coins, mugs, or floor scuffs rendered as decorative shapes.

Every decorative element remains within `InnRoom`, carries no interactive semantics, and ignores pointer events.

## Cape Rails and Trophy Surfaces

The cape collection already renders as independent left and right groups. Each populated group receives its own short wooden rail directly behind its capes. There is no full-width rail across the portrait or overhead text.

An empty cape collection renders no rail or pegs. Trophy shelves visually match the new wood palette and remain behind their interactive artifacts. Achievement controls and tooltip behavior do not change.

## Character Text Stack

The character content becomes one explicit grid inside `.player`:

1. overhead plaque;
2. portrait and worn cape;
3. identity caption; and
4. status-orb row.

The overhead copy sits inside a compact dark wooden dialogue plaque with an inset border and opaque backing. It receives a fixed maximum width, explicit line height, and padding. No rail, beam, trophy, or room seam may pass through its text.

The nameplate and class line move into a `character-caption` wrapper. The caption has its own dark translucent backing, border, vertical padding, and explicit line heights. The profile name, level, and prestige title remain separate readable rows.

Status orbs move from absolute positioning into the player grid below the caption. Their numbers and globes retain existing appearance and accessible labels. This removes the independent coordinate system that currently crowds the identity text.

The portrait context menu remains anchored above all scene content. The caption link, menu button, and achievement controls retain pointer access while empty player space remains pointer-transparent.

## Responsive Boundary

The polished room must work at 1440x1000 and at the supported 941x1000 desktop boundary. Furniture scales or shifts through the existing narrow-desktop media query. Text does not shrink below its current readable size; available scene decoration yields before character text does.

Mobile remains deferred. Existing rules below 941px may preserve the simpler stacked presentation.

## Failure Behavior

Long bios wrap within the overhead plaque and truncate through the existing character-domain rule. Long display names remain on one centered nameplate line when they fit; exceptionally long names may wrap within the caption without crossing the portrait, class line, or orbs.

Profiles with no capes render no empty rail. Profiles with capes render only the occupied left and right rails. Profiles without trophies still retain complete furniture and wall composition.

## Verification

Implementation follows test-driven development. Automated coverage must verify:

- the furniture component structure and decorative accessibility boundary;
- the fireplace contains stone surround, arched firebox, logs, and layered flame geometry;
- tables contain tabletop, plank, leg, seating, and contact-shadow geometry;
- empty cape groups produce no visible rail hook and populated groups receive separate rails;
- the character DOM order is overhead, portrait, caption, then status orbs;
- status orbs are no longer absolutely positioned;
- overhead and caption styles have opaque or translucent backing, padding, and explicit line height; and
- existing portrait menu, achievement focus, and tooltip contracts remain intact.

Real installed-Chrome acceptance runs on `/character/Conalh` and `/character/torvalds` at 1440x1000 and 941x1000. It checks furniture and text bounding boxes, verifies no text-text or text-room intersections, confirms empty/populated cape-rail behavior, exercises portrait and tooltip interactions, checks horizontal overflow, captures screenshots, and requires clean console, page-error, and request results.
