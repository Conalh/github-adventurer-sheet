import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { TrophyMaterial } from "../lib/trophyRoom";
import {
  TrophyArt,
  getTrophyCategory,
  getTrophyMaterialPalette,
} from "./TrophyArt";

const TROPHIES = [
  ["trophy:stars", "stars", "shelf"],
  ["trophy:followers", "followers", "wall"],
  ["trophy:forks", "forks", "shelf"],
  ["trophy:veteran", "veteran", "wall"],
  ["trophy:stewardship", "stewardship", "shelf"],
] as const;

describe("TrophyArt", () => {
  it("renders a distinct artifact and correct mount for every trophy category", () => {
    const markup = TROPHIES.map(([displayId]) =>
      renderToStaticMarkup(<TrophyArt displayId={displayId} material="Gold" />),
    );

    for (const [index, [displayId, category, mount]] of TROPHIES.entries()) {
      expect(getTrophyCategory(displayId)).toBe(category);
      expect(markup[index]).toContain(`data-trophy-art="${category}"`);
      expect(markup[index]).toContain(`data-mount="${mount}"`);
      expect(markup[index]).toContain(`trophy-art__${category}`);
    }
  });

  it("maps all material tiers and uses a neutral fallback artifact", () => {
    const materials: TrophyMaterial[] = ["Bronze", "Silver", "Gold", "Runite", "Legendary"];
    expect(new Set(materials.map((material) => getTrophyMaterialPalette(material).metal)).size)
      .toBe(materials.length);

    const unknown = renderToStaticMarkup(
      <TrophyArt displayId="trophy:unknown" material="Bronze" />,
    );
    expect(unknown).toContain('data-trophy-art="unknown"');
    expect(unknown).toContain('class="trophy-art__unknown"');
  });
});
