export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

export const EQUIPMENT_SLOT_ORDER = [
  "Head",
  "Cape",
  "Amulet",
  "Ammo",
  "Main hand",
  "Body",
  "Off hand",
  "Legs",
  "Hands",
  "Feet",
  "Ring"
] as const;

export type EquipmentSlot = (typeof EQUIPMENT_SLOT_ORDER)[number];
export type CountedName = { name: string; count: number };

export type EquipmentItem = {
  slot: EquipmentSlot;
  name: string;
  detail: string;
  rarity: Rarity;
  isFallback: boolean;
  href?: string;
};

export type BackpackItemKind =
  | "currency"
  | "license"
  | "language"
  | "topic"
  | "archive"
  | "template";

export type BackpackItem = {
  id: string;
  kind: BackpackItemKind;
  name: string;
  abbreviation: string;
  count: number;
  examine: string;
};

export type CharacterEquipment = {
  items: EquipmentItem[];
  backpack: BackpackItem[];
};

export type EquipmentRepoInput = {
  name: string;
  fullName: string;
  htmlUrl: string;
  stars: number;
  forks: number;
  updatedAt: string;
  topics: string[];
  sizeKb: number;
  openIssuesCount: number;
  createdAt: string;
  pushedAt: string | null;
  licenseSpdxId: string | null;
  archived: boolean;
  isTemplate: boolean;
  fork: boolean;
};

export type EquipmentInput = {
  user: { followers: number; publicGists: number };
  repos: EquipmentRepoInput[];
  accountAgeYears: number;
  languageCounts: CountedName[];
  topicCounts: CountedName[];
  now: Date;
  prestige: { capeSkill: string | null; trimmed: boolean };
};

export function normaliseCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

export function rarityFromThresholds(
  value: number,
  [uncommon, rare, epic, legendary]: [number, number, number, number]
): Rarity {
  if (value >= legendary) return "Legendary";
  if (value >= epic) return "Epic";
  if (value >= rare) return "Rare";
  if (value >= uncommon) return "Uncommon";
  return "Common";
}

export const getHeadRarity = (value: number) => rarityFromThresholds(value, [2, 4, 8, 15]);
export const getBodyRarity = (mb: number) => rarityFromThresholds(mb, [1, 10, 100, 1000]);
export const getLegsRarity = (years: number) => rarityFromThresholds(years, [1, 3, 6, 10]);
export const getHandsRarity = (value: number) => rarityFromThresholds(value, [5, 20, 100, 500]);
export const getFeetRarity = (value: number) => rarityFromThresholds(value, [3, 8, 15, 30]);
export const getAmmoRarity = (value: number) => rarityFromThresholds(value, [1, 10, 30, 100]);

export function getMainHandRarity(stars: number): Rarity {
  return rarityFromThresholds(stars, [10, 50, 250, 1000]);
}

export function getOffHandRarity(forks: number): Rarity {
  return rarityFromThresholds(forks, [5, 25, 100, 500]);
}

export function getCapeRarity(accountAgeYears: number): Rarity {
  return rarityFromThresholds(accountAgeYears, [1, 2, 5, 10]);
}

export function getAmuletRarity(distinctLanguages: number): Rarity {
  return rarityFromThresholds(distinctLanguages, [2, 4, 7, 10]);
}

export function getRingRarity(updatedAt: string, now: Date): Rarity {
  const updatedTime = getTime(updatedAt);

  if (updatedTime === 0) {
    return "Common";
  }

  const daysSince = (now.getTime() - updatedTime) / (24 * 60 * 60 * 1000);

  if (daysSince < 0) {
    return "Common";
  }

  if (daysSince <= 7) {
    return "Legendary";
  }

  if (daysSince <= 30) {
    return "Epic";
  }

  if (daysSince <= 90) {
    return "Rare";
  }

  if (daysSince <= 365) {
    return "Uncommon";
  }

  return "Common";
}

function getTime(dateValue: string): number {
  const time = new Date(dateValue).getTime();
  return Number.isFinite(time) ? time : 0;
}
