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
  description: string;
  language: string;
  difficulty: QuestDifficulty;
  difficultyScore: number;
  updatedLabel: string;
};

export type CharacterEquipment = {
  mainHand: string;
  offHand: string;
  cape: string;
  amulet: string;
  ring: string;
  backpack: string[];
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

  const attack = levelFromScore(metrics.originalRepos * 8 + metrics.totalRepos);
  const strength = levelFromScore(
    metrics.totalStars * 6 + metrics.totalForksReceived * 3
  );
  const defence = levelFromScore(
    metrics.accountAgeYears * 40 + metrics.archivedRepos * 8
  );
  const ranged = levelFromScore(
    metrics.totalForksReceived * 4 + metrics.totalWatchers * 2
  );
  const magic = levelFromScore(metrics.distinctLanguages * 25 + metrics.uniqueTopics * 2);
  const crafting = levelFromScore(
    metrics.describedRepos * 6 + metrics.homepageRepos * 12 + metrics.uniqueTopics * 3
  );
  const mining = levelFromScore(metrics.totalRepos * 6 + metrics.forksMade * 3);
  const smithing = levelFromScore(
    metrics.originalRepos * 10 + metrics.recentlyUpdatedRepos * 10
  );
  const prayer = levelFromScore(user.followers * 3 + user.following);
  const hitpoints = levelFromScore(
    (attack + strength + defence + ranged + magic) * 4
  );

  const skills: Record<SkillName, number> = {
    Attack: attack,
    Strength: strength,
    Defence: defence,
    Ranged: ranged,
    Magic: magic,
    Crafting: crafting,
    Mining: mining,
    Smithing: smithing,
    Prayer: prayer,
    Hitpoints: hitpoints
  };

  const strongestSkill = getStrongestSkill(skills);
  const languageCounts = getTopCounts(
    repos
      .map((repo) => repo.language)
      .filter((language): language is string => Boolean(language))
  );
  const topicCounts = getTopCounts(repos.flatMap((repo) => getRepoTopics(repo)));

  return {
    user,
    repos,
    metrics,
    skills,
    strongestSkill,
    characterClass: CLASS_BY_SKILL[strongestSkill],
    totalLevel: SKILL_NAMES.reduce((sum, skill) => sum + skills[skill], 0),
    combatLevel: calculateCombatLevel(skills),
    quests: getTopQuests(repos),
    equipment: getEquipment(repos, metrics.accountAgeYears, languageCounts, topicCounts),
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
  return `github-character:${username}`;
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
  const originalRepos = repos.filter((repo) => !repo.fork).length;
  const forksMade = repos.filter((repo) => repo.fork).length;
  const totalStars = sum(repos, (repo) => repo.stargazers_count);
  const totalForksReceived = sum(repos, (repo) => repo.forks_count);
  const totalWatchers = sum(repos, (repo) => repo.watchers_count);
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
      description: repo.description || "No quest description recorded.",
      language: repo.language || "Unknown",
      difficulty: getQuestDifficulty(repo),
      difficultyScore: getQuestDifficultyScore(repo),
      updatedLabel: formatDate(repo.updated_at)
    }));
}

function getEquipment(
  repos: GitHubRepo[],
  accountAgeYears: number,
  languageCounts: Array<{ name: string; count: number }>,
  topicCounts: Array<{ name: string; count: number }>
): CharacterEquipment {
  const mostStarred = maxRepo(repos, (repo) => repo.stargazers_count);
  const mostForked = maxRepo(repos, (repo) => repo.forks_count);
  const mostRecent = maxRepo(repos, (repo) => getTime(repo.updated_at));
  const mostUsedLanguage = languageCounts[0]?.name;
  const backpack = [...languageCounts, ...topicCounts]
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, 6)
    .map((item) => item.name);

  return {
    mainHand: mostStarred
      ? `${mostStarred.name} (${mostStarred.stargazers_count} stars)`
      : "No main hand discovered",
    offHand: mostForked
      ? `${mostForked.name} (${mostForked.forks_count} forks)`
      : "No off hand discovered",
    cape: getAccountAgeCape(accountAgeYears),
    amulet: mostUsedLanguage ? `${mostUsedLanguage} Amulet` : "Unattuned Amulet",
    ring: mostRecent ? `${mostRecent.name} Ring` : "No ring discovered",
    backpack: backpack.length > 0 ? backpack : ["No supplies discovered"]
  };
}

function getStrongestSkill(
  skills: Record<SkillName, number>
): Exclude<SkillName, "Hitpoints"> {
  return NON_HITPOINT_SKILLS.reduce((strongest, skill) =>
    skills[skill] > skills[strongest] ? skill : strongest
  );
}

function getAccountAgeCape(accountAgeYears: number): string {
  if (accountAgeYears >= 10) {
    return "Ancient Account Cape";
  }

  if (accountAgeYears >= 5) {
    return "Veteran Account Cape";
  }

  if (accountAgeYears >= 1) {
    return "Adventurer Account Cape";
  }

  return "Fresh Account Cape";
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

function sum<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((total, item) => total + selector(item), 0);
}

function maxRepo(
  repos: GitHubRepo[],
  selector: (repo: GitHubRepo) => number
): GitHubRepo | undefined {
  return repos.reduce<GitHubRepo | undefined>((best, repo) => {
    if (!best) {
      return repo;
    }

    const score = selector(repo);
    const bestScore = selector(best);

    if (score !== bestScore) {
      return score > bestScore ? repo : best;
    }

    return getTime(repo.updated_at) > getTime(best.updated_at) ? repo : best;
  }, undefined);
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

