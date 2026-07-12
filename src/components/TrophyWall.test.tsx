// @ts-expect-error The app intentionally omits Node typings; Vitest supplies this at runtime.
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { WallDisplay } from "../lib/trophyRoom";
import { TrophyWall } from "./TrophyWall";

const displays: WallDisplay[] = [
  {
    id: "cape:Strength",
    kind: "cape",
    zone: "cape-hooks",
    name: "Strength Skillcape (t)",
    material: null,
    evidence: "Level 99 Strength",
    description: "Mastery earned at level 99 Strength.",
    skill: "Strength",
    equipped: true,
    trimmed: true,
  },
  {
    id: "trophy:stars",
    kind: "trophy",
    zone: "upper-wall",
    name: "Star Relic",
    material: "Runite",
    evidence: "1,000 stars across original repositories.",
    description: "Awarded for stars earned by original repositories.",
    skill: null,
    equipped: false,
    trimmed: false,
  },
];

describe("TrophyWall", () => {
  it("renders accessible display buttons and tooltip content", () => {
    const markup = renderToStaticMarkup(<TrophyWall displays={displays} />);

    expect(markup).toContain('class="trophy-wall"');
    expect(markup).toContain('aria-label="Strength Skillcape (t). Level 99 Strength. Mastery earned at level 99 Strength."');
    expect(markup).toContain('data-equipped="true"');
    expect(markup).toContain('class="wall-display-tooltip"');
    expect(markup).toContain("Runite Star Relic");
    expect(markup.match(/type="button"/g)).toHaveLength(2);
    expect(markup).toContain('data-skill="Strength"');
    expect(markup).toContain('data-trimmed="true"');
    expect(markup).toContain('class="skillcape-art skillcape-art--wall"');
    expect(markup).toContain('class="skillcape-art__garment"');
    expect(markup).not.toContain('class="wall-display-art" aria-hidden="true"></span>');
    expect(markup).toContain('data-trophy-art="stars"');
    expect(markup).toContain('data-material="runite"');
  });

  it("attaches the zone and list layout classes used to keep displays separated", () => {
    const markup = renderToStaticMarkup(<TrophyWall displays={displays} />);

    expect(markup).toContain('<section aria-label="Cape hooks" class="wall-zone cape-hooks" data-cape-count="1">');
    expect(markup.match(/wall-display-list/g)).toHaveLength(4);
    expect(markup).toContain('class="wall-display cape cape-display"');
    expect(markup).not.toContain('class="wall-display cape skillcape"');
  });

  it("classifies every supported cape count around the portrait lane", () => {
    for (let count = 1; count <= 10; count += 1) {
      const capes: WallDisplay[] = Array.from({ length: count }, (_, index) => ({
        ...displays[0],
        id: `cape:${index}`,
        name: `Cape ${index + 1}`,
      }));
      const markup = renderToStaticMarkup(<TrophyWall displays={capes} />);

      expect(markup).toContain(`data-cape-count="${count}"`);
      expect(markup).toContain(`data-cape-side="left" data-display-count="${Math.ceil(count / 2)}"`);
      expect(markup).toContain(`data-cape-side="right" data-display-count="${Math.floor(count / 2)}"`);
      expect(markup.match(/class="wall-display cape cape-display"/g)).toHaveLength(count);
    }
  });

  it("renders each display exactly once without disabled buttons or links", () => {
    const manyDisplays: WallDisplay[] = Array.from({ length: 15 }, (_, index) => ({
      ...displays[1],
      id: `display-${index}`,
      zone: (["cape-hooks", "upper-wall", "trophy-shelf"] as const)[index % 3],
    }));
    const markup = renderToStaticMarkup(<TrophyWall displays={manyDisplays} />);

    for (const display of manyDisplays) {
      expect(markup.match(new RegExp(`data-display-id="${display.id}"`, "g"))).toHaveLength(1);
    }
    expect(markup.match(/type="button"/g)).toHaveLength(15);
    expect(markup).not.toContain(" disabled");
    expect(markup).not.toContain("<a");
  });

  it("uses separate populated cape rails and leaves empty groups bare", () => {
    const styles = readFileSync(new URL("../App.css", import.meta.url), "utf8");

    expect(styles).toMatch(/\.cape-hook-group\s*\{[^}]*position:\s*relative/s);
    expect(styles).toMatch(/\.cape-hook-group::before\s*\{[^}]*background:[^}]*box-shadow:/s);
    expect(styles).toMatch(/\.cape-hook-group\[data-display-count="0"\]::before\s*\{[^}]*display:\s*none/s);
    expect(styles).not.toContain(".wall-zone.cape-hooks::before");
  });

  it("raises the active wall display above the player and neighboring awards", () => {
    const styles = readFileSync(new URL("../App.css", import.meta.url), "utf8");
    const activeItem = styles.match(
      /\.wall-display-item:hover,\s*\.wall-display-item:focus-within\s*\{[^}]*z-index:\s*(\d+)/s,
    );
    const player = styles.match(/\.player\s*\{[^}]*z-index:\s*(\d+)/s);

    expect(activeItem).not.toBeNull();
    expect(player).not.toBeNull();
    expect(Number(activeItem?.[1])).toBeGreaterThan(Number(player?.[1]));
  });
});
