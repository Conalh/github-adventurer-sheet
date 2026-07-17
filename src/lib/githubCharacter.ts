import {
  buildEquipment,
  type CharacterEquipment,
  type EquipmentRepoInput
} from "./equipment";
import { buildTrophyRoom, type TrophyRoom } from "./trophyRoom";

export type GitHubUser = {
  login: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  html_url: string;
  created_at: string;
  followers: number;
  following: number;
  public_repos: number;
  public_gists: number;
};

export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  topics?: string[];
  archived: boolean;
  fork: boolean;
  updated_at: string;
  homepage: string | null;
  size: number;
  open_issues_count: number;
  created_at: string;
  pushed_at: string | null;
  license?: { spdx_id: string | null } | null;
  is_template: boolean;
};

export type SkillName =
  | "Attack"
  | "Strength"
  | "Defence"
  | "Ranged"
  | "Magic"
  | "Crafting"
  | "Mining"
  | "Smithing"
  | "Prayer"
  | "Hitpoints";

export type QuestDifficulty =
  | "Novice"
  | "Apprentice"
  | "Adept"
  | "Expert"
  | "Master";

export type CharacterQuest = {
  repo: GitHubRepo;
  title: string;
  description: string;
  language: string;
  difficulty: QuestDifficulty;
  difficultyScore: number;
  updatedLabel: string;
};

export type Achievement = {
  id: string;
  name: string;
  requirement: string;
  flavor: string;
  earned: boolean;
  current: number;
  goal: number;
};

export type PrestigeTier = 0 | 1 | 2 | 3;

export type PrestigeTitle = "Adept" | "Master" | "Grandmaster";

export type Prestige = {
  tier: PrestigeTier;
  title: PrestigeTitle | null;
  ninetyNines: SkillName[];
  capeSkill: SkillName | null;
  trimmed: boolean;
};

export type RepositoryMetrics = {
  totalRepos: number;
  originalRepos: number;
  forksMade: number;
  totalStars: number;
  totalForksReceived: number;
  totalWatchers: number;
  distinctLanguages: number;
  uniqueTopics: number;
  describedRepos: number;
  homepageRepos: number;
  archivedRepos: number;
  recentlyUpdatedRepos: number;
  accountAgeYears: number;
};

export type CharacterSheet = {
  user: GitHubUser;
  repos: GitHubRepo[];
  metrics: RepositoryMetrics;
  skills: Record<SkillName, number>;
  skillScores: Record<SkillName, number>;
  prestige: Prestige;
  trophyRoom: TrophyRoom;
  strongestSkill: Exclude<SkillName, "Hitpoints">;
  characterClass: string;
  totalLevel: number;
  combatLevel: number;
  quests: CharacterQuest[];
  equipment: CharacterEquipment;
  languageCounts: Array<{ name: string; count: number }>;
  topicCounts: Array<{ name: string; count: number }>;
};

export type GitHubCharacterErrorKind =
  | "invalid_username"
  | "not_found"
  | "rate_limit"
  | "network"
  | "generic";

export class GitHubCharacterError extends Error {
  readonly kind: GitHubCharacterErrorKind;
  readonly status?: number;

  constructor(
    kind: GitHubCharacterErrorKind,
    message: string,
    status?: number
  ) {
    super(message);
    this.name = "GitHubCharacterError";
    this.kind = kind;
    this.status = status;
  }
}

const API_BASE_URL = "https://api.github.com";
const CACHE_DURATION_MS = 10 * 60 * 1000;
const MAX_REPO_PAGES = 3;
const REPOS_PER_PAGE = 100;
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const RECENT_REPO_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

export const SKILL_NAMES: SkillName[] = [
  "Attack",
  "Strength",
  "Defence",
  "Ranged",
  "Magic",
  "Crafting",
  "Mining",
  "Smithing",
  "Prayer",
  "Hitpoints"
];

const NON_HITPOINT_SKILLS = SKILL_NAMES.filter(
  (skill): skill is Exclude<SkillName, "Hitpoints"> => skill !== "Hitpoints"
);

const CLASS_BY_SKILL: Record<Exclude<SkillName, "Hitpoints">, string> = {
  Attack: "Code Warrior",
  Strength: "Starforged Berserker",
  Defence: "Legacy Guardian",
  Ranged: "Fork Ranger",
  Magic: "Polyglot Mage",
  Crafting: "Interface Artisan",
  Mining: "Repo Miner",
  Smithing: "Build Smith",
  Prayer: "Community Acolyte"
};

export const SKILL_LORE: Record<SkillName, string> = {
  Attack: "Original repositories forged by hand",
  Strength: "Stars earned across the realm",
  Defence: "Years of service and guarded archives",
  Ranged: "Forks and watchers reached from afar",
  Magic: "Tongues spoken and topics mastered",
  Crafting: "Works described and published to the world",
  Mining: "Repositories unearthed from the deep",
  Smithing: "Fresh works still warm from the anvil",
  Prayer: "Followers and fellowships of the order",
  Hitpoints: "Vitality drawn from every combat art"
};

type CacheRecord = {
  createdAt: number;
  data: CharacterSheet;
};

const memoryCache = new Map<string, CacheRecord>();

export function parseGitHubUsername(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new GitHubCharacterError(
      "invalid_username",
      "Enter a GitHub username or profile URL."
    );
  }

  const withoutAt = trimmed.startsWith("@") ? trimmed.slice(1).trim() : trimmed;
  let candidate = withoutAt;

  if (
    /^https?:\/\//i.test(withoutAt) ||
    /^www\.github\.com\//i.test(withoutAt) ||
    /^github\.com\//i.test(withoutAt)
  ) {
    const urlValue = /^https?:\/\//i.test(withoutAt)
      ? withoutAt
      : `https://${withoutAt}`;

    let parsed: URL;
    try {
      parsed = new URL(urlValue);
    } catch {
      throw new GitHubCharacterError(
        "invalid_username",
        "That GitHub profile URL could not be read."
      );
    }

    const host = parsed.hostname.toLowerCase();
    if (host !== "github.com" && host !== "www.github.com") {
      throw new GitHubCharacterError(
        "invalid_username",
        "Use a github.com profile URL."
      );
    }

    const [username] = parsed.pathname.split("/").filter(Boolean);
    candidate = username ?? "";
  }

  if (!/^[A-Za-z0-9-]{1,39}$/.test(candidate)) {
    throw new GitHubCharacterError(
      "invalid_username",
      "GitHub usernames use letters, numbers, or hyphens and are at most 39 characters."
    );
  }

  if (candidate.startsWith("-") || candidate.endsWith("-")) {
    throw new GitHubCharacterError(
      "invalid_username",
      "GitHub usernames cannot begin or end with a hyphen."
    );
  }

  return candidate;
}

export function levelFromScore(score: number): number {
  const safeScore = Number.isFinite(score) ? Math.max(0, score) : 0;
  const level = Math.floor(1 + Math.log10(safeScore + 1) * 24);
  return Math.max(1, Math.min(99, level));
}

const MAX_LEVEL = 99;

/**
 * The genuine old-school RuneScape experience table:
 * xp(L) = floor( (1/4) * sum_{n=1}^{L-1} floor(n + 300 * 2^(n/7)) ).
 * Level 2 = 83 xp, level 99 = 13,034,431 xp.
 */
export function rsXpForLevel(level: number): number {
  const clamped = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  let points = 0;

  for (let n = 1; n < clamped; n += 1) {
    points += Math.floor(n + 300 * 2 ** (n / 7));
  }

  return Math.floor(points / 4);
}

function minScoreForLevel(level: number): number {
  if (level <= 1) {
    return 0;
  }

  return Math.max(0, 10 ** ((level - 1) / 24) - 1);
}

/**
 * Maps a raw skill score onto the authentic RuneScape xp scale by
 * interpolating between the xp thresholds of the current and next level.
 * Deterministic, monotonic in score, and capped at the level-99 xp.
 */
export function skillXpFromScore(score: number): number {
  const safeScore = Number.isFinite(score) ? Math.max(0, score) : 0;
  const level = levelFromScore(safeScore);

  if (level >= MAX_LEVEL) {
    return rsXpForLevel(MAX_LEVEL);
  }

  const floorScore = minScoreForLevel(level);
  const ceilScore = minScoreForLevel(level + 1);
  const span = ceilScore - floorScore;
  const fraction =
    span > 0 ? Math.min(1, Math.max(0, (safeScore - floorScore) / span)) : 0;
  const xpFloor = rsXpForLevel(level);
  const xpCeil = rsXpForLevel(level + 1);

  return Math.floor(xpFloor + fraction * (xpCeil - xpFloor));
}

export function getQuestDifficulty(repo: Pick<GitHubRepo, "stargazers_count" | "forks_count">): QuestDifficulty {
  const difficultyScore = repo.stargazers_count * 2 + repo.forks_count * 3;

  if (difficultyScore <= 10) {
    return "Novice";
  }

  if (difficultyScore <= 50) {
    return "Apprentice";
  }

  if (difficultyScore <= 150) {
    return "Adept";
  }

  if (difficultyScore <= 500) {
    return "Expert";
  }

  return "Master";
}

export function getQuestDifficultyScore(
  repo: Pick<GitHubRepo, "stargazers_count" | "forks_count">
): number {
  return repo.stargazers_count * 2 + repo.forks_count * 3;
}

export function clampCombatLevel(level: number): number {
  return Math.max(3, Math.min(126, level));
}

export function getPrestige(input: {
  skills: Record<SkillName, number>;
  skillScores: Record<SkillName, number>;
  totalLevel: number;
}): Prestige {
  const ninetyNines = SKILL_NAMES.filter(
    (skill) => input.skills[skill] >= 99
  );

  const capeSkill =
    [...ninetyNines].sort((left, right) => {
      const scoreGap = input.skillScores[right] - input.skillScores[left];

      if (scoreGap !== 0) {
        return scoreGap;
      }

      return SKILL_NAMES.indexOf(left) - SKILL_NAMES.indexOf(right);
    })[0] ?? null;

  let tier: PrestigeTier = 0;
  let title: PrestigeTitle | null = null;

  if (ninetyNines.length >= 3 || input.totalLevel >= 650) {
    tier = 3;
    title = "Grandmaster";
  } else if (ninetyNines.length >= 1 || input.totalLevel >= 550) {
    tier = 2;
    title = "Master";
  } else if (input.totalLevel >= 400) {
    tier = 1;
    title = "Adept";
  }

  return {
    tier,
    title,
    ninetyNines,
    capeSkill,
    trimmed: ninetyNines.length >= 2
  };
}

export function calculateCombatLevel(skills: Pick<
  Record<SkillName, number>,
  "Attack" | "Strength" | "Defence" | "Ranged" | "Magic" | "Hitpoints"
>): number {
  const melee = skills.Attack + skills.Strength;
  const rangedPower = Math.floor(skills.Ranged * 1.5);
  const magicPower = Math.floor(skills.Magic * 1.5);

  return clampCombatLevel(
    Math.floor(
      3 +
        (skills.Defence + skills.Hitpoints) * 0.25 +
        Math.max(melee, rangedPower, magicPower) * 0.325
    )
  );
}

export function calculateCharacterSheet(
  user: GitHubUser,
  repos: GitHubRepo[],
  now = new Date()
): CharacterSheet {
  const metrics = getRepositoryMetrics(user, repos, now);

  const combatScores = {
    Attack: metrics.originalRepos * 8 + metrics.totalRepos,
    Strength: metrics.totalStars * 6 + metrics.totalForksReceived * 3,
    Defence: metrics.accountAgeYears * 40 + metrics.archivedRepos * 8,
    Ranged: metrics.totalForksReceived * 4 + metrics.totalWatchers * 2,
    Magic: metrics.distinctLanguages * 25 + metrics.uniqueTopics * 2
  };

  const skillScores: Record<SkillName, number> = {
    ...combatScores,
    Crafting:
      metrics.describedRepos * 6 +
      metrics.homepageRepos * 12 +
      metrics.uniqueTopics * 3,
    Mining: metrics.totalRepos * 6 + metrics.forksMade * 3,
    Smithing: metrics.originalRepos * 10 + metrics.recentlyUpdatedRepos * 10,
    Prayer: user.followers * 3 + user.following,
    Hitpoints:
      (levelFromScore(combatScores.Attack) +
        levelFromScore(combatScores.Strength) +
        levelFromScore(combatScores.Defence) +
        levelFromScore(combatScores.Ranged) +
        levelFromScore(combatScores.Magic)) *
      4
  };

  const skills = Object.fromEntries(
    SKILL_NAMES.map((skill) => [skill, levelFromScore(skillScores[skill])])
  ) as Record<SkillName, number>;

  const strongestSkill = getStrongestSkill(skills);
  const languageCounts = getTopCounts(
    repos
      .map((repo) => repo.language)
      .filter((language): language is string => Boolean(language))
  );
  const topicCounts = getTopCounts(repos.flatMap((repo) => getRepoTopics(repo)));
  const totalLevel = SKILL_NAMES.reduce((sum, skill) => sum + skills[skill], 0);
  const prestige = getPrestige({ skills, skillScores, totalLevel });
  const trophyRoom = buildTrophyRoom({
    skills,
    skillScores,
    followers: user.followers,
    accountCreatedAt: user.created_at,
    repos,
    now
  });

  return {
    user,
    repos,
    metrics,
    skills,
    skillScores,
    prestige,
    trophyRoom,
    strongestSkill,
    characterClass: CLASS_BY_SKILL[strongestSkill],
    totalLevel,
    combatLevel: calculateCombatLevel(skills),
    quests: getTopQuests(repos),
    equipment: buildEquipment({
      user: {
        followers: user.followers,
        publicGists: user.public_gists
      },
      repos: repos.map(toEquipmentRepo),
      accountAgeYears: metrics.accountAgeYears,
      languageCounts,
      topicCounts,
      now,
      prestige
    }),
    languageCounts,
    topicCounts
  };
}

export async function getGitHubCharacter(
  value: string,
  options: { signal?: AbortSignal; now?: Date } = {}
): Promise<CharacterSheet> {
  const username = parseGitHubUsername(value);
  const cached = readCache(username);

  if (cached) {
    return cached;
  }

  const user = await requestGitHub<GitHubUser>(
    `${API_BASE_URL}/users/${encodeURIComponent(username)}`,
    options.signal
  );
  const repos = await fetchRepos(username, options.signal);
  const character = calculateCharacterSheet(user, repos, options.now);
  writeCache(username, character);

  return character;
}

export function getCharacterCacheKey(username: string): string {
  return `github-character:v8:${username}`;
}

async function fetchRepos(
  username: string,
  signal?: AbortSignal
): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];

  for (let page = 1; page <= MAX_REPO_PAGES; page += 1) {
    const pageRepos = await requestGitHub<GitHubRepo[]>(
      `${API_BASE_URL}/users/${encodeURIComponent(
        username
      )}/repos?per_page=${REPOS_PER_PAGE}&sort=updated&page=${page}`,
      signal
    );

    repos.push(...pageRepos);

    if (pageRepos.length < REPOS_PER_PAGE) {
      break;
    }
  }

  return repos;
}

async function requestGitHub<T>(url: string, signal?: AbortSignal): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      signal,
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new GitHubCharacterError(
      "network",
      "GitHub could not be reached. Check the connection and try again."
    );
  }

  if (!response.ok) {
    const message = await getResponseMessage(response);

    if (response.status === 404) {
      throw new GitHubCharacterError(
        "not_found",
        "No public GitHub profile was found for that username.",
        response.status
      );
    }

    if (
      response.status === 429 ||
      (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0")
    ) {
      throw new GitHubCharacterError(
        "rate_limit",
        "GitHub API rate limit reached. Try again later.",
        response.status
      );
    }

    throw new GitHubCharacterError(
      "generic",
      message || "GitHub returned an unexpected response.",
      response.status
    );
  }

  return response.json() as Promise<T>;
}

async function getResponseMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? "";
  } catch {
    return "";
  }
}

function getRepositoryMetrics(
  user: GitHubUser,
  repos: GitHubRepo[],
  now: Date
): RepositoryMetrics {
  const nowTime = now.getTime();
  const createdTime = new Date(user.created_at).getTime();
  const accountAgeYears = Number.isFinite(createdTime)
    ? Math.max(0, (nowTime - createdTime) / MS_PER_YEAR)
    : 0;

  const totalRepos = repos.length;
  const originalRepoRecords = repos.filter((repo) => !repo.fork);
  const originalRepos = originalRepoRecords.length;
  const forksMade = repos.filter((repo) => repo.fork).length;
  const totalStars = sum(originalRepoRecords, (repo) => repo.stargazers_count);
  const totalForksReceived = sum(
    originalRepoRecords,
    (repo) => repo.forks_count,
  );
  const totalWatchers = sum(originalRepoRecords, (repo) => repo.watchers_count);
  const languages = new Set(
    repos
      .map((repo) => repo.language)
      .filter((language): language is string => Boolean(language))
  );
  const topics = new Set(repos.flatMap((repo) => getRepoTopics(repo)));
  const describedRepos = repos.filter((repo) => Boolean(repo.description)).length;
  const homepageRepos = repos.filter((repo) => Boolean(repo.homepage)).length;
  const archivedRepos = repos.filter((repo) => repo.archived).length;
  const recentlyUpdatedRepos = repos.filter((repo) => {
    const updatedTime = new Date(repo.updated_at).getTime();
    return (
      Number.isFinite(updatedTime) &&
      updatedTime <= nowTime &&
      nowTime - updatedTime <= RECENT_REPO_WINDOW_MS
    );
  }).length;

  return {
    totalRepos,
    originalRepos,
    forksMade,
    totalStars,
    totalForksReceived,
    totalWatchers,
    distinctLanguages: languages.size,
    uniqueTopics: topics.size,
    describedRepos,
    homepageRepos,
    archivedRepos,
    recentlyUpdatedRepos,
    accountAgeYears
  };
}

const QUEST_TITLE_RULES: Array<{ pattern: RegExp; title: string }> = [
  { pattern: /recover|restore|backup|trail/, title: "A Recovery Trail" },
  { pattern: /agent|assistant|bot|copilot|\bai\b/, title: "Code's Assistant" },
  { pattern: /daemon|server|worker|service/, title: "Daemon Slayer" },
  { pattern: /array|data|database|store|cache/, title: "Shield of Array" },
  { pattern: /dependency|package|\bnpm\b|module/, title: "Dependency Slayer" },
  { pattern: /deploy|cloud|pages|infra|host/, title: "Recipe for Deployment" },
  { pattern: /test|spec|lint|quality|regression/, title: "Regression Slayer" },
  { pattern: /docs?|readme|wiki|guide/, title: "README & Juliet" },
  { pattern: /security|policy|auth|guard|scope/, title: "The Policy of Array" },
  { pattern: /ontology|schema|graph|taxonomy/, title: "Ontology's Wake" },
];

const FALLBACK_QUEST_TITLES = [
  "One Small Commit",
  "A Tail of Two Branches",
  "The Restless Host",
  "The Lost Repository",
  "Commit Diplomacy",
  "Branch of Misfortune",
  "Ernest the Pipeline",
] as const;

export function getQuestParodyTitle(repo: GitHubRepo): string {
  const searchable = [
    repo.name,
    repo.description ?? "",
    repo.language ?? "",
    ...(repo.topics ?? []),
  ]
    .join(" ")
    .toLowerCase();
  const matchedRule = QUEST_TITLE_RULES.find(({ pattern }) => pattern.test(searchable));

  if (matchedRule) return matchedRule.title;

  const hash = [...repo.full_name].reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );
  return FALLBACK_QUEST_TITLES[hash % FALLBACK_QUEST_TITLES.length];
}

function getTopQuests(repos: GitHubRepo[]): CharacterQuest[] {
  return [...repos]
    .sort((left, right) => {
      if (right.stargazers_count !== left.stargazers_count) {
        return right.stargazers_count - left.stargazers_count;
      }

      if (right.forks_count !== left.forks_count) {
        return right.forks_count - left.forks_count;
      }

      return getTime(right.updated_at) - getTime(left.updated_at);
    })
    .slice(0, 5)
    .map((repo) => ({
      repo,
      title: getQuestParodyTitle(repo),
      description: repo.description || "No quest description recorded.",
      language: repo.language || "Unknown",
      difficulty: getQuestDifficulty(repo),
      difficultyScore: getQuestDifficultyScore(repo),
      updatedLabel: formatDate(repo.updated_at)
    }));
}

export function getAchievements(
  user: Pick<GitHubUser, "followers">,
  metrics: RepositoryMetrics
): Achievement[] {
  const define = (
    id: string,
    name: string,
    requirement: string,
    flavor: string,
    current: number,
    goal: number
  ): Achievement => ({
    id,
    name,
    requirement,
    flavor,
    earned: current >= goal,
    current: Math.max(0, Math.floor(current)),
    goal
  });

  return [
    define(
      "first-forge",
      "First Forge",
      "Create an original repository",
      "Every legend begins with a single commit.",
      metrics.originalRepos,
      1
    ),
    define(
      "prolific-author",
      "Prolific Author",
      "Create 25 original repositories",
      "The shelves groan under the weight of your works.",
      metrics.originalRepos,
      25
    ),
    define(
      "starfall",
      "Starfall",
      "Earn 100 stars across all works",
      "The night sky bends toward your name.",
      metrics.totalStars,
      100
    ),
    define(
      "supernova",
      "Supernova",
      "Earn 1,000 stars across all works",
      "Astronomers file complaints about the glare.",
      metrics.totalStars,
      1000
    ),
    define(
      "polyglot",
      "Polyglot",
      "Write in 5 different languages",
      "You order breakfast fluently in every tavern.",
      metrics.distinctLanguages,
      5
    ),
    define(
      "archmage-of-tongues",
      "Archmage of Tongues",
      "Write in 10 different languages",
      "Compilers whisper your name with respect.",
      metrics.distinctLanguages,
      10
    ),
    define(
      "fork-lord",
      "Fork Lord",
      "Receive 50 forks across all works",
      "Your bloodline spreads across a thousand branches.",
      metrics.totalForksReceived,
      50
    ),
    define(
      "beloved",
      "Beloved of the Crowds",
      "Gather 100 followers",
      "They cheer before you even push.",
      user.followers,
      100
    ),
    define(
      "veteran",
      "Veteran of the Realm",
      "Serve 5 years on GitHub",
      "You remember when the dashboard looked different.",
      metrics.accountAgeYears,
      5
    ),
    define(
      "elder",
      "Elder of the Realm",
      "Serve 10 years on GitHub",
      "Junior adventurers ask you about the old wars.",
      metrics.accountAgeYears,
      10
    ),
    define(
      "lorekeeper",
      "Lorekeeper",
      "Describe 10 of your repositories",
      "A README for every ruin, a scroll for every spell.",
      metrics.describedRepos,
      10
    ),
    define(
      "cartographer",
      "Cartographer",
      "Tag works with 10 unique topics",
      "No corner of the map remains unlabeled.",
      metrics.uniqueTopics,
      10
    ),
    define(
      "homesteader",
      "Homesteader",
      "Publish 3 repositories with homepages",
      "Your works have doors, windows, and a welcome mat.",
      metrics.homepageRepos,
      3
    ),
    define(
      "keeper-of-the-flame",
      "Keeper of the Flame",
      "Update 5 repositories within 90 days",
      "The forge never cools on your watch.",
      metrics.recentlyUpdatedRepos,
      5
    )
  ];
}

function getStrongestSkill(
  skills: Record<SkillName, number>
): Exclude<SkillName, "Hitpoints"> {
  return NON_HITPOINT_SKILLS.reduce((strongest, skill) =>
    skills[skill] > skills[strongest] ? skill : strongest
  );
}

function getTopCounts(values: string[]): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();

  for (const rawValue of values) {
    const value = rawValue.trim();
    if (!value) {
      continue;
    }

    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.name.localeCompare(right.name);
    });
}

function getRepoTopics(repo: GitHubRepo): string[] {
  return Array.isArray(repo.topics) ? repo.topics.filter(Boolean) : [];
}

function toEquipmentRepo(repo: GitHubRepo): EquipmentRepoInput {
  return {
    name: repo.name,
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    updatedAt: repo.updated_at,
    topics: getRepoTopics(repo),
    sizeKb: repo.size,
    openIssuesCount: repo.open_issues_count,
    createdAt: repo.created_at,
    pushedAt: repo.pushed_at,
    licenseSpdxId: repo.license?.spdx_id ?? null,
    archived: repo.archived,
    isTemplate: repo.is_template,
    fork: repo.fork
  };
}

function sum<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((total, item) => total + selector(item), 0);
}

function getTime(dateValue: string): number {
  const time = new Date(dateValue).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function formatDate(dateValue: string): string {
  const time = getTime(dateValue);

  if (time === 0) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(time));
}

function readCache(username: string): CharacterSheet | null {
  const key = getCharacterCacheKey(username);
  const now = Date.now();
  const memoryRecord = memoryCache.get(key);

  if (memoryRecord && now - memoryRecord.createdAt <= CACHE_DURATION_MS) {
    return memoryRecord.data;
  }

  if (memoryRecord) {
    memoryCache.delete(key);
  }

  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const rawValue = storage.getItem(key);
    if (!rawValue) {
      return null;
    }

    const record = JSON.parse(rawValue) as CacheRecord;
    if (!record.createdAt || now - record.createdAt > CACHE_DURATION_MS) {
      storage.removeItem(key);
      return null;
    }

    memoryCache.set(key, record);
    return record.data;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

function writeCache(username: string, data: CharacterSheet): void {
  const key = getCharacterCacheKey(username);
  const record: CacheRecord = {
    createdAt: Date.now(),
    data
  };

  memoryCache.set(key, record);

  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, JSON.stringify(record));
  } catch {
    // Storage can fail in private browsing or when quota is exhausted.
  }
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

