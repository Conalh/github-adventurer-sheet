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

const MATERIALS: TrophyMaterial[] = ["Bronze", "Silver", "Gold", "Runite", "Legendary"];
const THRESHOLDS = {
  stars: [1, 10, 100, 1_000, 10_000],
  followers: [10, 100, 1_000, 10_000, 100_000],
  forks: [1, 10, 100, 1_000, 10_000],
  veteran: [1, 3, 5, 10, 15],
  stewardship: [1, 3, 10, 25, 50]
} as const;

function materialFor(value: number, thresholds: readonly number[]): TrophyMaterial | null {
  let tier = -1;
  thresholds.forEach((threshold, index) => { if (value >= threshold) tier = index; });
  return tier < 0 ? null : MATERIALS[tier];
}

function completedUtcYears(createdAt: string, now: Date): number {
  const created = new Date(createdAt);
  if (!Number.isFinite(created.getTime()) || !Number.isFinite(now.getTime()) || created > now) return 0;

  let years = now.getUTCFullYear() - created.getUTCFullYear();
  const anniversary = new Date(created.getTime());
  anniversary.setUTCFullYear(created.getUTCFullYear() + years);
  if (anniversary > now) years -= 1;
  return Math.max(0, years);
}

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

  const trophies: WallDisplay[] = [];
  const addTrophy = (
    id: string,
    name: string,
    value: number,
    thresholds: readonly number[],
    evidence: string,
    description: string,
    zone: WallZone
  ) => {
    const material = materialFor(value, thresholds);
    if (material === null) return;
    trophies.push({
      id,
      kind: "trophy",
      zone,
      name,
      material,
      evidence,
      description,
      skill: null,
      equipped: false,
      trimmed: false
    });
  };

  const originalRepos = input.repos.filter((repo) => !repo.fork);
  const stars = originalRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const forks = originalRepos.reduce((sum, repo) => sum + repo.forks_count, 0);
  const stewardship = originalRepos.filter((repo) => {
    if (repo.archived || repo.pushed_at === null) return false;
    const created = new Date(repo.created_at);
    const pushed = new Date(repo.pushed_at);
    if (!Number.isFinite(created.getTime()) || !Number.isFinite(pushed.getTime())) return false;
    const day = 24 * 60 * 60 * 1_000;
    return pushed.getTime() - created.getTime() >= 365 * day
      && input.now.getTime() - pushed.getTime() <= 365 * day
      && pushed <= input.now;
  }).length;
  const veteranYears = completedUtcYears(input.accountCreatedAt, input.now);

  addTrophy("trophy:stars", "Star Relic", stars, THRESHOLDS.stars,
    `${stars.toLocaleString("en-US")} stars across original repositories.`,
    "Awarded for stars earned by original repositories.", "upper-wall");
  addTrophy("trophy:followers", "Fellowship Standard", input.followers, THRESHOLDS.followers,
    `${input.followers.toLocaleString("en-US")} GitHub followers.`,
    "Awarded for building a fellowship of followers.", "upper-wall");
  addTrophy("trophy:forks", "Forked Anvil", forks, THRESHOLDS.forks,
    `${forks.toLocaleString("en-US")} forks across original repositories.`,
    "Awarded for forks of original repositories.", "trophy-shelf");
  addTrophy("trophy:veteran", "Veteran's Plaque", veteranYears, THRESHOLDS.veteran,
    `${veteranYears} completed account years.`,
    "Awarded for completed years on GitHub.", "upper-wall");
  addTrophy("trophy:stewardship", "Steward's Lantern", stewardship, THRESHOLDS.stewardship,
    `${stewardship} actively stewarded original repositories.`,
    "Awarded for long-lived original repositories maintained within the past year.", "trophy-shelf");

  return { displays: [...capes, ...trophies] };
}
