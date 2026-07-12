import { describe, expect, it } from "vitest";
import type { GitHubRepo, SkillName } from "./githubCharacter";
import { buildTrophyRoom } from "./trophyRoom";

const skills = {
  Attack: 99, Strength: 99, Defence: 40, Ranged: 1, Magic: 1,
  Crafting: 1, Mining: 1, Smithing: 1, Prayer: 1, Hitpoints: 50
} satisfies Record<SkillName, number>;

const skillScores = {
  Attack: 5_000, Strength: 9_000, Defence: 40, Ranged: 1, Magic: 1,
  Crafting: 1, Mining: 1, Smithing: 1, Prayer: 1, Hitpoints: 50
} satisfies Record<SkillName, number>;

const repo = (overrides: Partial<GitHubRepo> = {}): GitHubRepo => ({
  id: 1, name: "kernel", full_name: "dev/kernel", html_url: "https://github.com/dev/kernel",
  description: null, language: "C", stargazers_count: 100, forks_count: 10,
  watchers_count: 100, archived: false, fork: false, updated_at: "2026-07-01T00:00:00Z",
  homepage: null, size: 1, open_issues_count: 0, created_at: "2024-01-01T00:00:00Z",
  pushed_at: "2026-07-01T00:00:00Z", is_template: false,
  ...overrides
});

const lowSkills = { ...skills, Attack: 1, Strength: 1 };
const lowScores = { ...skillScores, Attack: 1, Strength: 1 };

describe("buildTrophyRoom Skillcapes", () => {
  it("creates one wall hook for every level-99 skill", () => {
    const room = buildTrophyRoom({
      skills, skillScores, followers: 0, accountCreatedAt: "2026-01-01T00:00:00Z",
      repos: [], now: new Date("2026-07-12T00:00:00Z")
    });
    expect(room.displays.filter((item) => item.kind === "cape").map((item) => item.id))
      .toEqual(["cape:Attack", "cape:Strength"]);
  });

  it("marks only the highest-scoring mastery as equipped and trims it", () => {
    const room = buildTrophyRoom({
      skills, skillScores, followers: 0, accountCreatedAt: "2026-01-01T00:00:00Z",
      repos: [], now: new Date("2026-07-12T00:00:00Z")
    });
    expect(room.displays.filter((item) => item.kind === "cape").map((item) => ({
      id: item.id, equipped: item.equipped, trimmed: item.trimmed
    }))).toEqual([
      { id: "cape:Attack", equipped: false, trimmed: false },
      { id: "cape:Strength", equipped: true, trimmed: true }
    ]);
  });
});

describe("buildTrophyRoom GitHub trophies", () => {
  const now = new Date("2026-07-12T00:00:00Z");
  const materialCases = [
    ["Bronze", 1], ["Silver", 10], ["Gold", 100], ["Runite", 1_000], ["Legendary", 10_000],
  ] as const;

  it.each(materialCases)("upgrades star trophies to %s at %i", (material, threshold) => {
    const below = buildTrophyRoom({ skills: lowSkills, skillScores: lowScores, followers: 0,
      accountCreatedAt: now.toISOString(), repos: [repo({ stargazers_count: threshold - 1, forks_count: 0 })], now });
    const exact = buildTrophyRoom({ skills: lowSkills, skillScores: lowScores, followers: 0,
      accountCreatedAt: now.toISOString(), repos: [repo({ stargazers_count: threshold, forks_count: 0 })], now });
    expect(below.displays.find(({ id }) => id === "trophy:stars")?.material ?? null)
      .not.toBe(material);
    expect(exact.displays.find(({ id }) => id === "trophy:stars")?.material).toBe(material);
  });

  it.each([["Bronze", 10], ["Silver", 100], ["Gold", 1_000], ["Runite", 10_000], ["Legendary", 100_000]] as const)
    ("upgrades follower trophies to %s at %i", (material, threshold) => {
      const trophy = (followers: number) => buildTrophyRoom({ skills: lowSkills, skillScores: lowScores,
        followers, accountCreatedAt: now.toISOString(), repos: [], now }).displays
        .find(({ id }) => id === "trophy:followers")?.material ?? null;
      expect(trophy(threshold - 1)).not.toBe(material);
      expect(trophy(threshold)).toBe(material);
    });

  it.each(materialCases)("upgrades fork trophies to %s at %i", (material, threshold) => {
    const trophy = (forks: number) => buildTrophyRoom({ skills: lowSkills, skillScores: lowScores,
      followers: 0, accountCreatedAt: now.toISOString(), repos: [repo({ stargazers_count: 0, forks_count: forks })], now })
      .displays.find(({ id }) => id === "trophy:forks")?.material ?? null;
    expect(trophy(threshold - 1)).not.toBe(material);
    expect(trophy(threshold)).toBe(material);
  });

  it.each([["Bronze", 1], ["Silver", 3], ["Gold", 5], ["Runite", 10], ["Legendary", 15]] as const)
    ("upgrades veteran trophies to %s at %i completed years", (material, threshold) => {
      const trophy = (years: number) => buildTrophyRoom({ skills: lowSkills, skillScores: lowScores,
        followers: 0, accountCreatedAt: `${2026 - years}-07-12T00:00:00Z`, repos: [], now }).displays
        .find(({ id }) => id === "trophy:veteran")?.material ?? null;
      expect(trophy(threshold - 1)).not.toBe(material);
      expect(trophy(threshold)).toBe(material);
    });

  it.each([["Bronze", 1], ["Silver", 3], ["Gold", 10], ["Runite", 25], ["Legendary", 50]] as const)
    ("upgrades stewardship trophies to %s at %i repositories", (material, threshold) => {
      const trophy = (count: number) => buildTrophyRoom({ skills: lowSkills, skillScores: lowScores,
        followers: 0, accountCreatedAt: now.toISOString(), repos: Array.from({ length: count }, (_, id) => repo({ id,
          created_at: "2025-07-12T00:00:00Z", pushed_at: "2026-07-12T00:00:00Z" })), now }).displays
        .find(({ id }) => id === "trophy:stewardship")?.material ?? null;
      expect(trophy(threshold - 1)).not.toBe(material);
      expect(trophy(threshold)).toBe(material);
    });

  it("counts an exact 365-day lifespan and freshness, but rejects future pushes", () => {
    const stewardship = (created_at: string, pushed_at: string) => buildTrophyRoom({ skills: lowSkills,
      skillScores: lowScores, followers: 0, accountCreatedAt: now.toISOString(), repos: [repo({ created_at, pushed_at })], now })
      .displays.some(({ id }) => id === "trophy:stewardship");
    expect(stewardship("2024-07-12T00:00:00Z", "2025-07-12T00:00:00Z")).toBe(true);
    expect(stewardship("2025-07-12T00:00:00Z", "2026-07-13T00:00:00Z")).toBe(false);
  });

  it("upgrades each earned trophy at exact material boundaries", () => {
    const room = buildTrophyRoom({
      skills: lowSkills, skillScores: lowScores, followers: 1_000,
      accountCreatedAt: "2016-07-12T00:00:00Z",
      repos: [repo({ stargazers_count: 1_000, forks_count: 100 })],
      now: new Date("2026-07-12T00:00:00Z")
    });
    expect(room.displays.filter((item) => item.kind === "trophy").map((item) => [item.id, item.material]))
      .toEqual([
        ["trophy:stars", "Runite"], ["trophy:followers", "Gold"],
        ["trophy:forks", "Gold"], ["trophy:veteran", "Runite"],
        ["trophy:stewardship", "Bronze"]
      ]);
  });

  it("omits unearned trophies and invalid stewardship timestamps", () => {
    const room = buildTrophyRoom({
      skills: lowSkills, skillScores: lowScores, followers: 0,
      accountCreatedAt: "not-a-date", repos: [repo({ stargazers_count: 0, forks_count: 0, pushed_at: null })],
      now: new Date("2026-07-12T00:00:00Z")
    });
    expect(room.displays).toEqual([]);
  });

  it("retains every legendary trophy for a celebrity-scale profile", () => {
    const repos = Array.from({ length: 50 }, (_, index) => repo({
      id: index + 1,
      name: `repo-${index + 1}`,
      full_name: `dev/repo-${index + 1}`,
      stargazers_count: index === 0 ? 10_000 : 0,
      forks_count: index === 0 ? 10_000 : 0
    }));
    const room = buildTrophyRoom({
      skills: lowSkills,
      skillScores: lowScores,
      followers: 100_000,
      accountCreatedAt: "2006-07-12T00:00:00Z",
      repos,
      now: new Date("2026-07-12T00:00:00Z")
    });
    const trophies = room.displays.filter((item) => item.kind === "trophy");
    expect(trophies).toHaveLength(5);
    expect(trophies.every((item) => item.material === "Legendary")).toBe(true);
  });
});
