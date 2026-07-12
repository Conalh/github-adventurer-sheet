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
});
