import { describe, expect, it } from "vitest";
import {
  buildEquipment,
  EQUIPMENT_SLOT_ORDER,
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
  rarityFromThresholds,
  type EquipmentInput,
  type EquipmentItem,
  type EquipmentRepoInput,
  type EquipmentSlot
} from "./equipment";

function equipmentRepo(
  overrides: Partial<EquipmentRepoInput> = {}
): EquipmentRepoInput {
  return {
    name: "sample",
    fullName: "owner/sample",
    htmlUrl: "https://github.com/owner/sample",
    stars: 0,
    forks: 0,
    updatedAt: "2026-06-01T00:00:00Z",
    topics: [],
    sizeKb: 0,
    openIssuesCount: 0,
    createdAt: "2025-01-01T00:00:00Z",
    pushedAt: "2026-01-01T00:00:00Z",
    licenseSpdxId: null,
    archived: false,
    isTemplate: false,
    fork: false,
    ...overrides
  };
}

function equipmentInput(overrides: Partial<EquipmentInput> = {}): EquipmentInput {
  return {
    user: { followers: 4, publicGists: 0 },
    repos: [],
    accountAgeYears: 6,
    languageCounts: [],
    topicCounts: [],
    now: new Date("2026-07-01T00:00:00Z"),
    prestige: { capeSkill: null, trimmed: false },
    ...overrides
  };
}

function findSlot(items: EquipmentItem[], slot: EquipmentSlot): EquipmentItem {
  const found = items.find((item) => item.slot === slot);
  if (!found) throw new Error(`Missing ${slot} slot`);
  return found;
}

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

describe("buildEquipment", () => {
  it("derives every worn slot in canonical order for a rich profile", () => {
    const richInput = equipmentInput({
      user: { followers: 200, publicGists: 12 },
      repos: [equipmentRepo({
        name: "atlas",
        fullName: "owner/atlas",
        stars: 500,
        forks: 30,
        topics: ["ai-agents"],
        sizeKb: 20_480,
        openIssuesCount: 25,
        createdAt: "2018-01-01T00:00:00Z",
        pushedAt: "2026-01-01T00:00:00Z"
      })],
      languageCounts: [{ name: "TypeScript", count: 1 }],
      topicCounts: [{ name: "ai-agents", count: 4 }]
    });

    const equipment = buildEquipment(richInput);
    expect(equipment.items.map((item) => item.slot)).toEqual(EQUIPMENT_SLOT_ORDER);
    expect(equipment.items).toHaveLength(11);
    expect(findSlot(equipment.items, "Head").name).toBe("Helm of ai-agents");
    expect(findSlot(equipment.items, "Body").name).toBe("Breastplate of atlas");
    expect(findSlot(equipment.items, "Legs").name).toBe("Greaves of atlas");
    expect(findSlot(equipment.items, "Hands").detail).toContain("issues & pull requests");
    expect(findSlot(equipment.items, "Feet").name).toBe("Boots of Wandering");
    expect(findSlot(equipment.items, "Ammo").name).toBe("Quiver of Gists");
    expect(findSlot(equipment.items, "Main hand")).toMatchObject({
      name: "Blade of atlas",
      detail: "500 stars — most starred work",
      rarity: "Epic",
      href: "https://github.com/owner/sample",
      isFallback: false
    });
    expect(findSlot(equipment.items, "Off hand")).toMatchObject({
      name: "Aegis of atlas",
      detail: "30 forks — most forked work",
      rarity: "Rare",
      isFallback: false
    });
    expect(findSlot(equipment.items, "Cape").name).toBe("Veteran Account Cape");
    expect(findSlot(equipment.items, "Amulet").name).toBe("TypeScript Amulet");
    expect(findSlot(equipment.items, "Ring").name).toBe("Signet of atlas");
    expect(equipment.backpack).toEqual([]);
  });

  it("rejects invalid, zero, and negative maintenance spans", () => {
    const repos = [
      equipmentRepo({ fullName: "owner/invalid", createdAt: "invalid", pushedAt: "invalid" }),
      equipmentRepo({
        fullName: "owner/zero",
        createdAt: "2026-01-01T00:00:00Z",
        pushedAt: "2026-01-01T00:00:00Z"
      }),
      equipmentRepo({
        fullName: "owner/negative",
        createdAt: "2026-02-01T00:00:00Z",
        pushedAt: "2026-01-01T00:00:00Z"
      })
    ];

    expect(findSlot(buildEquipment(equipmentInput({ repos })).items, "Legs")).toMatchObject({
      name: "Patched Trousers",
      rarity: "Common",
      isFallback: true
    });
  });

  it("uses named Common fallbacks for all six new slots", () => {
    const equipment = buildEquipment(equipmentInput());
    const expected = [
      ["Head", "Unadorned Hood", "No field of study declared"],
      ["Body", "Cloth Tunic", "Travelling light"],
      ["Legs", "Patched Trousers", "Every journey starts somewhere"],
      ["Hands", "Bare Hands", "No open quarrels"],
      ["Feet", "Barefoot", "The grass is soft here"],
      ["Ammo", "Empty Quiver", "No gists loosed"]
    ] as const;

    for (const [slot, name, detail] of expected) {
      expect(findSlot(equipment.items, slot)).toMatchObject({
        name,
        detail,
        rarity: "Common",
        isFallback: true
      });
    }
  });

  it("selects tied repositories alphabetically by fullName regardless of input order", () => {
    const alpha = equipmentRepo({
      name: "alpha",
      fullName: "owner/alpha",
      sizeKb: 100,
      openIssuesCount: 10,
      createdAt: "2020-01-01T00:00:00Z",
      pushedAt: "2022-01-01T00:00:00Z"
    });
    const zeta = equipmentRepo({
      name: "zeta",
      fullName: "owner/zeta",
      sizeKb: 100,
      openIssuesCount: 10,
      createdAt: "2020-01-01T00:00:00Z",
      pushedAt: "2022-01-01T00:00:00Z"
    });

    for (const repos of [[zeta, alpha], [alpha, zeta]]) {
      const items = buildEquipment(equipmentInput({ repos })).items;
      expect(findSlot(items, "Body").name).toBe("Breastplate of alpha");
      expect(findSlot(items, "Legs").name).toBe("Greaves of alpha");
      expect(findSlot(items, "Hands").name).toBe("Gauntlets of alpha");
    }
  });
});
