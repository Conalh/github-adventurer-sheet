import type { GitHubRepo, SkillName } from "./githubCharacter";

export type TrophyMaterial = "Bronze" | "Silver" | "Gold" | "Runite" | "Legendary";
export type WallZone = "cape-hooks" | "upper-wall" | "trophy-shelf";

export type WallDisplay = {
  id: string;
  kind: "cape" | "trophy";
  zone: WallZone;
  name: string;
  material: TrophyMaterial | null;
  evidence: string;
  description: string;
  skill: SkillName | null;
  equipped: boolean;
  trimmed: boolean;
};

export type TrophyRoom = { displays: WallDisplay[] };

export type TrophyRoomInput = {
  skills: Record<SkillName, number>;
  skillScores: Record<SkillName, number>;
  followers: number;
  accountCreatedAt: string;
  repos: GitHubRepo[];
  now: Date;
};

const SKILL_ORDER: SkillName[] = [
  "Attack", "Strength", "Defence", "Ranged", "Magic",
  "Crafting", "Mining", "Smithing", "Prayer", "Hitpoints"
];

export function buildTrophyRoom(input: TrophyRoomInput): TrophyRoom {
  const mastered = SKILL_ORDER.filter((skill) => input.skills[skill] === 99);
  const worn = mastered.reduce<SkillName | null>((best, skill) =>
    best === null || input.skillScores[skill] > input.skillScores[best] ? skill : best,
  null);

  const capes: WallDisplay[] = mastered.map((skill) => ({
    id: `cape:${skill}`,
    kind: "cape",
    zone: "cape-hooks",
    name: `${skill} Skillcape${mastered.length > 1 && skill === worn ? " (t)" : ""}`,
    material: null,
    evidence: `Level 99 ${skill}`,
    description: `Mastery earned at level 99 ${skill}.`,
    skill,
    equipped: skill === worn,
    trimmed: mastered.length > 1 && skill === worn
  }));

  return { displays: capes };
}
