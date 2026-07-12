import type { CSSProperties } from "react";
import type { SkillName } from "../lib/githubCharacter";
import { SKILL_COLORS, SKILL_ICONS } from "./icons";

export type SkillcapePalette = {
  body: string;
  side: string;
  mantle: string;
  trim: string;
};

const CAPE_PALETTES: Record<SkillName, SkillcapePalette> = {
  Attack: { body: "#9f281f", side: "#5a1715", mantle: "#342d29", trim: "#d6a72f" },
  Strength: { body: "#28783c", side: "#164c2a", mantle: "#273029", trim: "#d6a72f" },
  Defence: { body: "#8ba9d7", side: "#526b96", mantle: "#383d43", trim: "#d8d5c7" },
  Ranged: { body: "#667d2e", side: "#3c4d1b", mantle: "#30352a", trim: "#d6a72f" },
  Magic: { body: "#273d8c", side: "#182453", mantle: "#282c42", trim: "#d6a72f" },
  Crafting: { body: "#7b4b28", side: "#4e2d19", mantle: "#373029", trim: "#d6a72f" },
  Mining: { body: "#506779", side: "#30414f", mantle: "#30363a", trim: "#aebbc4" },
  Smithing: { body: "#3e464d", side: "#242a2e", mantle: "#292d30", trim: "#aebbc4" },
  Prayer: { body: "#e7e2cf", side: "#a7a493", mantle: "#5c5b55", trim: "#d6a72f" },
  Hitpoints: { body: "#f0eee6", side: "#b8b1a8", mantle: "#4d4642", trim: "#a72724" },
};

const FALLBACK_PALETTE: SkillcapePalette = {
  body: "#6f6759",
  side: "#403b34",
  mantle: "#302d29",
  trim: "#a89a78",
};

export function getSkillcapePalette(skill: SkillName | string): SkillcapePalette {
  return CAPE_PALETTES[skill as SkillName] ?? FALLBACK_PALETTE;
}

export function SkillcapeArt({
  skill,
  trimmed,
  variant,
  className = "",
}: {
  skill: SkillName | string;
  trimmed: boolean;
  variant: "wall" | "worn";
  className?: string;
}) {
  const palette = getSkillcapePalette(skill);
  const SkillIcon = SKILL_ICONS[skill as SkillName];
  const style = {
    "--cape-body": palette.body,
    "--cape-side": palette.side,
    "--cape-mantle": palette.mantle,
    "--cape-trim": trimmed ? palette.trim : SKILL_COLORS[skill as SkillName] ?? palette.trim,
  } as CSSProperties;

  return (
    <span
      className={`skillcape-art skillcape-art--${variant} ${className}`.trim()}
      data-skill={skill}
      data-trimmed={trimmed || undefined}
      style={style}
      aria-hidden="true"
    >
      <svg className="skillcape-art__garment" viewBox="0 0 96 142" focusable="false">
        <path className="skillcape-art__horn" d="M32 20 13 5 7 9l20 25z" />
        <path className="skillcape-art__horn" d="m64 20 19-15 6 4-20 25z" />
        <path className="skillcape-art__body" d="M28 22h40l13 109-14 7-19-5-19 5-14-7z" />
        <path className="skillcape-art__side" d="M28 22 15 131l14 7 10-105zM68 22l13 109-14 7L57 33z" />
        <path className="skillcape-art__mantle" d="M25 18q23 18 46 0l-5 25q-18-10-36 0z" />
        <path className="skillcape-art__neck" d="M39 19q9 9 18 0l-3 12H42z" />
        <path className="skillcape-art__trim" d="M28 22 15 131l14 7M68 22l13 109-14 7" />
      </svg>
      <span className="skillcape-art__emblem">{SkillIcon ? <SkillIcon /> : "◆"}</span>
    </span>
  );
}
