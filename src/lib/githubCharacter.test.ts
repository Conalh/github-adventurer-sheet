import { describe, expect, it } from "vitest";
import {
  calculateCharacterSheet,
  clampCombatLevel,
  getAchievements,
  getAmuletRarity,
  getCapeRarity,
  getMainHandRarity,
  getOffHandRarity,
  getQuestDifficulty,
  getRingRarity,
  levelFromScore,
  parseGitHubUsername,
  rarityFromThresholds,
  type EquipmentItem,
  type GitHubRepo,
  type GitHubUser
} from "./githubCharacter";

const baseUser: GitHubUser = {
  login: "ConalH",
  name: "Conal",
  avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
  bio: null,
  location: null,
  company: null,
  blog: null,
  html_url: "https://github.com/ConalH",
  created_at: "2020-01-01T00:00:00Z",
  followers: 10,
  following: 3,
  public_repos: 2
};

function repo(overrides: Partial<GitHubRepo>): GitHubRepo {
  return {
    id: 1,
    name: "sample-quest",
    full_name: "ConalH/sample-quest",
    html_url: "https://github.com/ConalH/sample-quest",
    description: "A useful repository",
    language: "TypeScript",
    stargazers_count: 0,
    forks_count: 0,
    watchers_count: 0,
    topics: [],
    archived: false,
    fork: false,
    updated_at: "2026-06-01T00:00:00Z",
    homepage: null,
    ...overrides
  };
}

describe("parseGitHubUsername", () => {
  it("accepts usernames, handles, and GitHub profile URLs", () => {
    expect(parseGitHubUsername("ConalH")).toBe("ConalH");
    expect(parseGitHubUsername("@ConalH")).toBe("ConalH");
    expect(parseGitHubUsername("github.com/ConalH")).toBe("ConalH");
    expect(parseGitHubUsername("https://github.com/ConalH")).toBe("ConalH");
    expect(parseGitHubUsername("https://www.github.com/ConalH")).toBe("ConalH");
  });

  it("rejects invalid GitHub usernames", () => {
    expect(() => parseGitHubUsername("-ConalH")).toThrow(
      "cannot begin or end"
    );
    expect(() => parseGitHubUsername("ConalH-")).toThrow(
      "cannot begin or end"
    );
    expect(() => parseGitHubUsername("Conal_H")).toThrow("letters, numbers");
    expect(() => parseGitHubUsername("a".repeat(40))).toThrow(
      "at most 39 characters"
    );
  });
});

describe("levelFromScore", () => {
  it("clamps to the RuneScape-style 1 to 99 range", () => {
    expect(levelFromScore(0)).toBe(1);
    expect(levelFromScore(-10)).toBe(1);
    expect(levelFromScore(Number.NaN)).toBe(1);
    expect(levelFromScore(10 ** 8)).toBe(99);
  });

  it("scales logarithmically from score", () => {
    expect(levelFromScore(9)).toBe(25);
    expect(levelFromScore(99)).toBe(49);
    expect(levelFromScore(999)).toBe(73);
  });
});

describe("combat level", () => {
  it("clamps combat level to the requested bounds", () => {
    expect(clampCombatLevel(-20)).toBe(3);
    expect(clampCombatLevel(72)).toBe(72);
    expect(clampCombatLevel(999)).toBe(126);
  });
});

describe("quest difficulty", () => {
  it("maps difficulty scores to named tiers", () => {
    expect(getQuestDifficulty(repo({ stargazers_count: 5, forks_count: 0 }))).toBe(
      "Novice"
    );
    expect(getQuestDifficulty(repo({ stargazers_count: 20, forks_count: 0 }))).toBe(
      "Apprentice"
    );
    expect(getQuestDifficulty(repo({ stargazers_count: 60, forks_count: 0 }))).toBe(
      "Adept"
    );
    expect(getQuestDifficulty(repo({ stargazers_count: 200, forks_count: 0 }))).toBe(
      "Expert"
    );
    expect(getQuestDifficulty(repo({ stargazers_count: 300, forks_count: 0 }))).toBe(
      "Master"
    );
  });
});

describe("calculateCharacterSheet", () => {
  it("uses deterministic formulas for skills and totals", () => {
    const sheet = calculateCharacterSheet(
      baseUser,
      [
        repo({
          name: "alpha",
          stargazers_count: 12,
          forks_count: 3,
          watchers_count: 4,
          topics: ["react", "typescript"],
          homepage: "https://example.com"
        }),
        repo({
          id: 2,
          name: "beta",
          language: "Python",
          stargazers_count: 1,
          forks_count: 0,
          watchers_count: 1,
          fork: true,
          archived: true,
          updated_at: "2026-01-01T00:00:00Z"
        })
      ],
      new Date("2026-07-01T00:00:00Z")
    );

    expect(sheet.skills.Attack).toBe(levelFromScore(1 * 8 + 2));
    expect(sheet.skills.Strength).toBe(levelFromScore(13 * 6 + 3 * 3));
    expect(sheet.skills.Magic).toBe(levelFromScore(2 * 25 + 2 * 2));
    expect(sheet.totalLevel).toBe(
      Object.values(sheet.skills).reduce((total, level) => total + level, 0)
    );
  });

  it("handles empty and missing repository fields without fake repo data", () => {
    const sheet = calculateCharacterSheet(
      { ...baseUser, public_repos: 1 },
      [
        repo({
          description: null,
          language: null,
          topics: undefined,
          homepage: null
        })
      ],
      new Date("2026-07-01T00:00:00Z")
    );

    expect(sheet.quests[0]?.description).toBe("No quest description recorded.");
    expect(sheet.quests[0]?.language).toBe("Unknown");
    expect(findSlot(sheet.equipment.items, "Amulet").name).toBe(
      "Unattuned Amulet"
    );
    expect(sheet.equipment.backpack).toEqual(["No supplies discovered"]);
  });

  it("returns intentional fallback equipment when there are no public repos", () => {
    const sheet = calculateCharacterSheet(
      { ...baseUser, public_repos: 0 },
      [],
      new Date("2026-07-01T00:00:00Z")
    );

    expect(sheet.quests).toEqual([]);
    expect(findSlot(sheet.equipment.items, "Main hand").name).toBe(
      "Empty scabbard"
    );
    expect(findSlot(sheet.equipment.items, "Off hand").name).toBe("Bare arm");
    expect(findSlot(sheet.equipment.items, "Ring").name).toBe("Bare finger");
    for (const item of sheet.equipment.items) {
      if (item.slot !== "Cape") {
        expect(item.rarity).toBe("Common");
      }
    }
    expect(findSlot(sheet.equipment.items, "Cape").rarity).toBe("Epic");
  });

  it("names and rates equipment from the strongest repositories", () => {
    const sheet = calculateCharacterSheet(
      baseUser,
      [
        repo({
          name: "excalibur",
          stargazers_count: 1200,
          forks_count: 30,
          updated_at: "2026-06-29T00:00:00Z"
        }),
        repo({
          id: 2,
          name: "round-table",
          stargazers_count: 4,
          forks_count: 110,
          updated_at: "2026-02-01T00:00:00Z"
        })
      ],
      new Date("2026-07-01T00:00:00Z")
    );

    const mainHand = findSlot(sheet.equipment.items, "Main hand");
    expect(mainHand.name).toBe("Blade of excalibur");
    expect(mainHand.rarity).toBe("Legendary");

    const offHand = findSlot(sheet.equipment.items, "Off hand");
    expect(offHand.name).toBe("Aegis of round-table");
    expect(offHand.rarity).toBe("Epic");

    const ring = findSlot(sheet.equipment.items, "Ring");
    expect(ring.name).toBe("Signet of excalibur");
    expect(ring.rarity).toBe("Legendary");
  });
});

describe("rarity tiers", () => {
  it("maps values onto the five rarity tiers", () => {
    const thresholds: [number, number, number, number] = [10, 50, 250, 1000];
    expect(rarityFromThresholds(0, thresholds)).toBe("Common");
    expect(rarityFromThresholds(10, thresholds)).toBe("Uncommon");
    expect(rarityFromThresholds(50, thresholds)).toBe("Rare");
    expect(rarityFromThresholds(250, thresholds)).toBe("Epic");
    expect(rarityFromThresholds(1000, thresholds)).toBe("Legendary");
  });

  it("rates each slot with its own thresholds", () => {
    expect(getMainHandRarity(9)).toBe("Common");
    expect(getMainHandRarity(50)).toBe("Rare");
    expect(getOffHandRarity(500)).toBe("Legendary");
    expect(getCapeRarity(0.5)).toBe("Common");
    expect(getCapeRarity(10)).toBe("Legendary");
    expect(getAmuletRarity(4)).toBe("Rare");
  });

  it("rates ring rarity by recency and survives bad dates", () => {
    const now = new Date("2026-07-01T00:00:00Z");
    expect(getRingRarity("2026-06-29T00:00:00Z", now)).toBe("Legendary");
    expect(getRingRarity("2026-06-10T00:00:00Z", now)).toBe("Epic");
    expect(getRingRarity("2026-05-01T00:00:00Z", now)).toBe("Rare");
    expect(getRingRarity("2025-08-01T00:00:00Z", now)).toBe("Uncommon");
    expect(getRingRarity("2020-01-01T00:00:00Z", now)).toBe("Common");
    expect(getRingRarity("not-a-date", now)).toBe("Common");
    expect(getRingRarity("2027-01-01T00:00:00Z", now)).toBe("Common");
  });
});

describe("achievements", () => {
  it("derives earned state and progress deterministically", () => {
    const sheet = calculateCharacterSheet(
      { ...baseUser, followers: 250, created_at: "2014-01-01T00:00:00Z" },
      [
        repo({ stargazers_count: 150, topics: ["a", "b", "c"] }),
        repo({ id: 2, name: "beta", language: "Python" })
      ],
      new Date("2026-07-01T00:00:00Z")
    );

    const achievements = getAchievements(sheet.user, sheet.metrics);
    const byId = new Map(achievements.map((entry) => [entry.id, entry]));

    expect(byId.get("first-forge")?.earned).toBe(true);
    expect(byId.get("starfall")?.earned).toBe(true);
    expect(byId.get("supernova")?.earned).toBe(false);
    expect(byId.get("supernova")?.current).toBe(150);
    expect(byId.get("supernova")?.goal).toBe(1000);
    expect(byId.get("beloved")?.earned).toBe(true);
    expect(byId.get("elder")?.earned).toBe(true);
    expect(byId.get("polyglot")?.current).toBe(2);
    expect(byId.get("polyglot")?.earned).toBe(false);
  });

  it("never reports negative or fractional progress", () => {
    const achievements = getAchievements(
      { followers: 0 },
      {
        totalRepos: 0,
        originalRepos: 0,
        forksMade: 0,
        totalStars: 0,
        totalForksReceived: 0,
        totalWatchers: 0,
        distinctLanguages: 0,
        uniqueTopics: 0,
        describedRepos: 0,
        homepageRepos: 0,
        archivedRepos: 0,
        recentlyUpdatedRepos: 0,
        accountAgeYears: 2.75
      }
    );

    for (const achievement of achievements) {
      expect(achievement.current).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(achievement.current)).toBe(true);
      expect(achievement.earned).toBe(achievement.current >= achievement.goal);
    }
  });
});

function findSlot(items: EquipmentItem[], slot: EquipmentItem["slot"]) {
  const item = items.find((entry) => entry.slot === slot);

  if (!item) {
    throw new Error(`Missing equipment slot: ${slot}`);
  }

  return item;
}

