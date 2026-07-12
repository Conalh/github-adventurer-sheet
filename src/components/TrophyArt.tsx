import type { CSSProperties, ReactNode } from "react";
import type { TrophyMaterial } from "../lib/trophyRoom";

export type TrophyCategory =
  | "stars"
  | "followers"
  | "forks"
  | "veteran"
  | "stewardship"
  | "unknown";

export type TrophyMaterialPalette = {
  metal: string;
  shadow: string;
  highlight: string;
  glow: string;
};

const MATERIAL_PALETTES: Record<TrophyMaterial, TrophyMaterialPalette> = {
  Bronze: { metal: "#a85f32", shadow: "#5b2f1c", highlight: "#d88a4e", glow: "transparent" },
  Silver: { metal: "#aeb8c2", shadow: "#59636d", highlight: "#e5edf2", glow: "transparent" },
  Gold: { metal: "#d4a62f", shadow: "#765115", highlight: "#ffe17a", glow: "rgba(255,210,76,.24)" },
  Runite: { metal: "#4da9b0", shadow: "#245b62", highlight: "#86e1df", glow: "rgba(77,210,213,.28)" },
  Legendary: { metal: "#9b55d0", shadow: "#4a2869", highlight: "#e1a1ff", glow: "rgba(187,94,255,.38)" },
};

const CATEGORIES = new Set<TrophyCategory>([
  "stars", "followers", "forks", "veteran", "stewardship",
]);

export function getTrophyCategory(displayId: string): TrophyCategory {
  const category = displayId.startsWith("trophy:") ? displayId.slice(7) : "";
  return CATEGORIES.has(category as TrophyCategory)
    ? category as TrophyCategory
    : "unknown";
}

export function getTrophyMaterialPalette(material: TrophyMaterial): TrophyMaterialPalette {
  return MATERIAL_PALETTES[material];
}

function artifact(category: TrophyCategory): ReactNode {
  switch (category) {
    case "stars":
      return <g className="trophy-art__stars"><path d="M48 12 58 35 83 38 64 55 69 80 48 67 27 80 32 55 13 38 38 35z" /><path d="M34 84h28l8 13H26z" /></g>;
    case "followers":
      return <g className="trophy-art__followers"><path d="M18 12h60v74L48 102 18 86z" /><circle cx="39" cy="43" r="9" /><circle cx="58" cy="43" r="9" /><path d="M29 70q19-21 38 0" /></g>;
    case "forks":
      return <g className="trophy-art__forks"><path d="M13 35h70v16L65 62H36L22 81H10l14-30H13z" /><path d="M38 30V14M58 30V14M38 22h20" /><path d="M29 80h39l8 15H20z" /></g>;
    case "veteran":
      return <g className="trophy-art__veteran"><path d="M17 18h62v58Q48 103 17 76z" /><path d="M48 29v49M31 45h34" /><path d="M27 14h42" /></g>;
    case "stewardship":
      return <g className="trophy-art__stewardship"><path d="M28 27h40l8 62H20z" /><path d="M33 27q15-23 30 0" /><path className="trophy-art__flame" d="M48 48q18 17 0 32-18-15 0-32z" /><path d="M16 91h64" /></g>;
    default:
      return <g className="trophy-art__unknown"><path d="M20 18h56v58Q48 101 20 76z" /><path d="m48 35 13 14-13 19-13-19z" /></g>;
  }
}

export function TrophyArt({
  displayId,
  material,
}: {
  displayId: string;
  material: TrophyMaterial;
}) {
  const category = getTrophyCategory(displayId);
  const palette = getTrophyMaterialPalette(material);
  const mount = category === "followers" || category === "veteran" ? "wall" : "shelf";
  const style = {
    "--trophy-metal": palette.metal,
    "--trophy-shadow": palette.shadow,
    "--trophy-highlight": palette.highlight,
    "--trophy-glow": palette.glow,
  } as CSSProperties;

  return (
    <span
      className={`trophy-art trophy-art--${category}`}
      data-trophy-art={category}
      data-material={material.toLowerCase()}
      data-mount={mount}
      style={style}
      aria-hidden="true"
    >
      <svg viewBox="0 0 96 108" focusable="false">{artifact(category)}</svg>
    </span>
  );
}
