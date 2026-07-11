import { describe, expect, it } from "vitest";
import {
  calculateCharacterSheet,
  clampCombatLevel,
  getQuestDifficulty,
  levelFromScore,
  parseGitHubUsername,
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
    expect(sheet.equipment.amulet).toBe("Unattuned Amulet");
    expect(sheet.equipment.backpack).toEqual(["No supplies discovered"]);
  });

  it("returns intentional fallback equipment when there are no public repos", () => {
    const sheet = calculateCharacterSheet(
      { ...baseUser, public_repos: 0 },
      [],
      new Date("2026-07-01T00:00:00Z")
    );

    expect(sheet.quests).toEqual([]);
    expect(sheet.equipment.mainHand).toBe("No main hand discovered");
    expect(sheet.equipment.offHand).toBe("No off hand discovered");
    expect(sheet.equipment.ring).toBe("No ring discovered");
  });
});

