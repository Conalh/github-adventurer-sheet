import { describe, expect, it } from "vitest";
import type { RepositoryMetrics } from "./githubCharacter";
import {
  getRealmDestinationName,
  getRealmForPrestige,
  getRealmImpact,
} from "./realm";

const metrics = {
  totalRepos: 12,
  totalStars: 251_074,
  totalForksReceived: 64_392,
} as RepositoryMetrics;

describe("profile realms", () => {
  it("routes every prestige tier to a materially named world", () => {
    expect(getRealmForPrestige(0).id).toBe("roadside");
    expect(getRealmForPrestige(1).name).toBe("The Guild Inn");
    expect(getRealmForPrestige(2).name).toBe("The Heroes' Hearth");
    expect(getRealmForPrestige(3)).toMatchObject({
      id: "legend",
      name: "The Hall of Legends",
      instanceLabel: "Grandmaster instance",
    });
    expect(getRealmDestinationName(getRealmForPrestige(3))).toBe(
      "the Hall of Legends",
    );
  });

  it("puts uncapped public impact directly into master realms", () => {
    expect(getRealmImpact(3, metrics, 312_112)).toEqual([
      { label: "stars", value: "251,074" },
      { label: "forks", value: "64,392" },
      { label: "followers", value: "312,112" },
    ]);
    expect(getRealmImpact(1, metrics, 19)).toEqual([
      { label: "public quests", value: "12" },
      { label: "followers", value: "19" },
    ]);
  });
});
