import { describe, expect, it } from "vitest";
import {
  getAmmoRarity,
  getAmuletRarity,
  getBodyRarity,
  getCapeRarity,
  getFeetRarity,
  getHandsRarity,
  getHeadRarity,
  getLegsRarity,
  getMainHandRarity,
  getOffHandRarity,
  getRingRarity,
  normaliseCount,
  rarityFromThresholds
} from "./equipment";

describe("equipment foundations", () => {
  it.each([
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
    [-8, 0],
    [4.9, 4]
  ])("normalises %s to %s", (value, expected) => {
    expect(normaliseCount(value)).toBe(expected);
  });

  it("maps every new slot at and below its first threshold", () => {
    expect(rarityFromThresholds(1, [2, 4, 8, 15])).toBe("Common");
    expect(getHeadRarity(2)).toBe("Uncommon");
    expect(getBodyRarity(10)).toBe("Rare");
    expect(getLegsRarity(6)).toBe("Epic");
    expect(getHandsRarity(500)).toBe("Legendary");
    expect(getFeetRarity(15)).toBe("Epic");
    expect(getAmmoRarity(1)).toBe("Uncommon");
  });

  it("preserves the existing five slot rarity behavior", () => {
    expect(getMainHandRarity(50)).toBe("Rare");
    expect(getOffHandRarity(500)).toBe("Legendary");
    expect(getCapeRarity(10)).toBe("Legendary");
    expect(getAmuletRarity(4)).toBe("Rare");
    expect(getRingRarity("2026-06-29T00:00:00Z", new Date("2026-07-01T00:00:00Z"))).toBe(
      "Legendary"
    );
  });
});
