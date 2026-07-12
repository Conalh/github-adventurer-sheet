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
