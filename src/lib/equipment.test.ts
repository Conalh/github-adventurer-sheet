import { describe, expect, it } from "vitest";
import {
  buildEquipment,
  calculateReputationGold,
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
  formatStackCount,
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

  it.each([
    ["Head", getHeadRarity, 1, "Common"],
    ["Head", getHeadRarity, 2, "Uncommon"],
    ["Head", getHeadRarity, 3, "Uncommon"],
    ["Head", getHeadRarity, 4, "Rare"],
    ["Head", getHeadRarity, 7, "Rare"],
    ["Head", getHeadRarity, 8, "Epic"],
    ["Head", getHeadRarity, 14, "Epic"],
    ["Head", getHeadRarity, 15, "Legendary"],
    ["Body", getBodyRarity, 0, "Common"],
    ["Body", getBodyRarity, 1, "Uncommon"],
    ["Body", getBodyRarity, 9, "Uncommon"],
    ["Body", getBodyRarity, 10, "Rare"],
    ["Body", getBodyRarity, 99, "Rare"],
    ["Body", getBodyRarity, 100, "Epic"],
    ["Body", getBodyRarity, 999, "Epic"],
    ["Body", getBodyRarity, 1000, "Legendary"],
    ["Legs", getLegsRarity, 0, "Common"],
    ["Legs", getLegsRarity, 1, "Uncommon"],
    ["Legs", getLegsRarity, 2, "Uncommon"],
    ["Legs", getLegsRarity, 3, "Rare"],
    ["Legs", getLegsRarity, 5, "Rare"],
    ["Legs", getLegsRarity, 6, "Epic"],
    ["Legs", getLegsRarity, 9, "Epic"],
    ["Legs", getLegsRarity, 10, "Legendary"],
    ["Hands", getHandsRarity, 4, "Common"],
    ["Hands", getHandsRarity, 5, "Uncommon"],
    ["Hands", getHandsRarity, 19, "Uncommon"],
    ["Hands", getHandsRarity, 20, "Rare"],
    ["Hands", getHandsRarity, 99, "Rare"],
    ["Hands", getHandsRarity, 100, "Epic"],
    ["Hands", getHandsRarity, 499, "Epic"],
    ["Hands", getHandsRarity, 500, "Legendary"],
    ["Feet", getFeetRarity, 2, "Common"],
    ["Feet", getFeetRarity, 3, "Uncommon"],
    ["Feet", getFeetRarity, 7, "Uncommon"],
    ["Feet", getFeetRarity, 8, "Rare"],
    ["Feet", getFeetRarity, 14, "Rare"],
    ["Feet", getFeetRarity, 15, "Epic"],
    ["Feet", getFeetRarity, 29, "Epic"],
    ["Feet", getFeetRarity, 30, "Legendary"],
    ["Ammo", getAmmoRarity, 0, "Common"],
    ["Ammo", getAmmoRarity, 1, "Uncommon"],
    ["Ammo", getAmmoRarity, 9, "Uncommon"],
    ["Ammo", getAmmoRarity, 10, "Rare"],
    ["Ammo", getAmmoRarity, 29, "Rare"],
    ["Ammo", getAmmoRarity, 30, "Epic"],
    ["Ammo", getAmmoRarity, 99, "Epic"],
    ["Ammo", getAmmoRarity, 100, "Legendary"]
  ] as const)("maps a new-slot threshold boundary", (_slot, rarity, value, expected) => {
    expect(rarity(value)).toBe(expected);
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
  it("breaks equal Main hand star scores by newer update date, then API order", () => {
    const older = equipmentRepo({
      name: "alpha",
      fullName: "owner/alpha",
      stars: 10,
      updatedAt: "2026-01-01T00:00:00Z"
    });
    const newer = equipmentRepo({
      name: "zeta",
      fullName: "owner/zeta",
      stars: 10,
      updatedAt: "2026-06-01T00:00:00Z"
    });
    expect(findSlot(buildEquipment(equipmentInput({ repos: [older, newer] })).items, "Main hand").name)
      .toBe("Blade of zeta");

    const sameDate = { ...older, updatedAt: newer.updatedAt };
    expect(findSlot(buildEquipment(equipmentInput({ repos: [newer, sameDate] })).items, "Main hand").name)
      .toBe("Blade of zeta");
  });

  it("breaks equal Off hand fork scores by newer update date, then API order", () => {
    const older = equipmentRepo({
      name: "alpha",
      fullName: "owner/alpha",
      forks: 10,
      updatedAt: "2026-01-01T00:00:00Z"
    });
    const newer = equipmentRepo({
      name: "zeta",
      fullName: "owner/zeta",
      forks: 10,
      updatedAt: "2026-06-01T00:00:00Z"
    });
    expect(findSlot(buildEquipment(equipmentInput({ repos: [older, newer] })).items, "Off hand").name)
      .toBe("Aegis of zeta");

    const sameDate = { ...older, updatedAt: newer.updatedAt };
    expect(findSlot(buildEquipment(equipmentInput({ repos: [newer, sameDate] })).items, "Off hand").name)
      .toBe("Aegis of zeta");
  });

  it("does not forge star or fork weapons from inherited upstream popularity", () => {
    const original = equipmentRepo({
      name: "original-work",
      fullName: "owner/original-work",
      stars: 12,
      forks: 3,
    });
    const famousFork = equipmentRepo({
      name: "famous-upstream",
      fullName: "owner/famous-upstream",
      stars: 1_000_000,
      forks: 500_000,
      fork: true,
    });
    const equipment = buildEquipment(
      equipmentInput({ repos: [famousFork, original] }),
    );

    expect(findSlot(equipment.items, "Main hand").name).toBe(
      "Blade of original-work",
    );
    expect(findSlot(equipment.items, "Off hand").name).toBe(
      "Aegis of original-work",
    );
  });

  it("preserves API order for Ring timestamp ties despite alphabetical names", () => {
    const alpha = equipmentRepo({ name: "alpha", fullName: "owner/alpha" });
    const zeta = equipmentRepo({ name: "zeta", fullName: "owner/zeta" });

    expect(findSlot(buildEquipment(equipmentInput({ repos: [zeta, alpha] })).items, "Ring").name)
      .toBe("Signet of zeta");
    expect(findSlot(buildEquipment(equipmentInput({ repos: [alpha, zeta] })).items, "Ring").name)
      .toBe("Signet of alpha");
  });

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
    expect(equipment.backpack[0]).toMatchObject({ id: "currency:gold", count: 15_794 });
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

  it.each([
    [1023, "Common", "1,023 KB of hammered code"],
    [1024, "Uncommon", "1 MB of hammered code"]
  ] as const)("derives Body at %d KB as %s with readable detail", (sizeKb, rarity, detail) => {
    const body = findSlot(buildEquipment(equipmentInput({
      repos: [equipmentRepo({ sizeKb })]
    })).items, "Body");
    expect(body).toMatchObject({ rarity, detail });
  });

  it.each([
    ["2026-01-01T00:00:00Z", "2026-06-30T00:00:00Z", "Maintained for 5 months", "Common"],
    ["2024-01-01T00:00:00Z", "2026-06-30T00:00:00Z", "Maintained for 2 years", "Uncommon"]
  ] as const)("formats Legs maintenance from %s to %s", (createdAt, pushedAt, detail, rarity) => {
    const legs = findSlot(buildEquipment(equipmentInput({
      repos: [equipmentRepo({ createdAt, pushedAt })]
    })).items, "Legs");
    expect(legs).toMatchObject({ detail, rarity });
  });
});

describe("backpack", () => {
  it.each([
    [0, 0, 0],
    [4, 2, 141],
    [200, 500, 15_794],
    [311_435, 250_769, 6_993_251]
  ])("mints calibrated gold", (followers, stars, expected) => {
    expect(calculateReputationGold(followers, stars)).toBe(expected);
  });

  it.each([
    [141, "141"],
    [1_000, "1K"],
    [15_794, "15.8K"],
    [1_000_000, "1M"],
    [6_993_251, "7M"]
  ])("formats %i as %s", (count, expected) => {
    expect(formatStackCount(count)).toBe(expected);
  });

  it("builds grouped, deterministic backpack stacks in priority order and caps at 28", () => {
    const repos = [
      equipmentRepo({ fullName: "owner/mit-a", stars: 2, licenseSpdxId: "MIT", archived: true }),
      equipmentRepo({ fullName: "owner/mit-b", stars: 999, licenseSpdxId: " mit ", fork: true, isTemplate: true }),
      equipmentRepo({ fullName: "owner/none", licenseSpdxId: "NOASSERTION" }),
      equipmentRepo({ fullName: "owner/empty", licenseSpdxId: " " }),
      equipmentRepo({ fullName: "owner/apache", licenseSpdxId: "Apache-2.0" })
    ];
    const languageCounts = [
      { name: "Go", count: 8 },
      ...Array.from({ length: 20 }, (_, index) => ({ name: `Language ${index}`, count: 1 }))
    ];
    const topicCounts = [
      { name: "Go", count: 8 },
      ...Array.from({ length: 10 }, (_, index) => ({ name: `Topic ${index}`, count: 1 }))
    ];

    const backpack = buildEquipment(equipmentInput({ repos, languageCounts, topicCounts })).backpack;

    expect(backpack).toHaveLength(28);
    expect(backpack.slice(0, 3).map(({ id, count }) => ({ id, count }))).toEqual([
      { id: "currency:gold", count: 141 },
      { id: "license:mit", count: 2 },
      { id: "license:apache-2.0", count: 1 }
    ]);
    expect(backpack[1]).toMatchObject({ name: "MIT Scroll", abbreviation: "MIT" });
    expect(backpack.find((item) => item.id === "language:go")).toMatchObject({ count: 8 });
    expect(backpack.find((item) => item.id === "topic:go")).toMatchObject({ count: 8 });
    expect(backpack.indexOf(backpack.find((item) => item.id === "language:go")!)).toBeLessThan(
      backpack.indexOf(backpack.find((item) => item.id === "topic:go")!)
    );
    expect(backpack.map((item) => item.id)).not.toContain("license:noassertion");
    expect(backpack.every((item) => item.examine.includes(item.count.toLocaleString("en")))).toBe(true);
  });

  it("keeps optional archive and template stacks after supplies", () => {
    const backpack = buildEquipment(equipmentInput({
      repos: [equipmentRepo({ archived: true, isTemplate: true })]
    })).backpack;
    expect(backpack.map((item) => item.id)).toEqual([
      "currency:gold",
      "archive:repos",
      "template:repos"
    ]);
  });
});
