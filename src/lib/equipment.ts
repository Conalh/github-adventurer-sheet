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

export function calculateReputationGold(followers: number, stars: number): number {
  const reputation = Math.sqrt(normaliseCount(followers) * normaliseCount(stars));
  return Math.round((50 * reputation) / (1 + reputation / 280_000));
}

const stackFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1
});

export function formatStackCount(count: number): string {
  return stackFormatter.format(normaliseCount(count));
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

function item(
  slot: EquipmentSlot,
  name: string,
  detail: string,
  rarity: Rarity,
  href?: string
): EquipmentItem {
  return { slot, name, detail, rarity, isFallback: false, ...(href ? { href } : {}) };
}

function fallback(slot: EquipmentSlot, name: string, detail: string): EquipmentItem {
  return { slot, name, detail, rarity: "Common", isFallback: true };
}

function maxRepo(
  repos: EquipmentRepoInput[],
  score: (repo: EquipmentRepoInput) => number
): EquipmentRepoInput | undefined {
  return [...repos].sort(
    (a, b) => score(b) - score(a) || a.fullName.localeCompare(b.fullName)
  )[0];
}

function legacyMaxRepo(
  repos: EquipmentRepoInput[],
  score: (repo: EquipmentRepoInput) => number,
  breakTiesByUpdatedAt = false
): EquipmentRepoInput | undefined {
  return repos.reduce<EquipmentRepoInput | undefined>((best, repo) => {
    if (!best || score(repo) > score(best)) return repo;
    if (
      breakTiesByUpdatedAt &&
      score(repo) === score(best) &&
      getTime(repo.updatedAt) > getTime(best.updatedAt)
    ) return repo;
    return best;
  }, undefined);
}

function pluralize(count: number, noun: string): string {
  return `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;
}

function exactCount(count: number): string {
  return normaliseCount(count).toLocaleString("en");
}

function sortBackpackItems(items: BackpackItem[]): BackpackItem[] {
  return items.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function currencyItem(gold: number): BackpackItem {
  const count = normaliseCount(gold);
  return {
    id: "currency:gold",
    kind: "currency",
    name: "Gold Pouch",
    abbreviation: "GP",
    count,
    examine: `A pouch containing exactly ${exactCount(count)} gold pieces.`
  };
}

function licenseName(spdxId: string): string {
  const upper = spdxId.toUpperCase();
  if (upper === "MIT") return "MIT Scroll";
  if (upper.startsWith("GPL-")) return "GPL Grimoire";
  if (upper.startsWith("APACHE-")) return "Apache Writ";
  if (upper === "UNLICENSE") return "Unlicense Talisman";
  return `${spdxId} Scroll`;
}

function buildLicenseItems(repos: EquipmentRepoInput[]): BackpackItem[] {
  const licenses = new Map<string, { spdxId: string; count: number }>();
  for (const repo of repos) {
    const spdxId = repo.licenseSpdxId?.trim();
    if (!spdxId || spdxId.toUpperCase() === "NOASSERTION") continue;
    const key = spdxId.toLowerCase();
    const current = licenses.get(key);
    if (current) {
      current.count += 1;
      if (spdxId.localeCompare(current.spdxId) < 0) current.spdxId = spdxId;
    }
    else licenses.set(key, { spdxId, count: 1 });
  }

  return sortBackpackItems([...licenses.entries()].map(([key, { spdxId, count }]) => ({
    id: `license:${key}`,
    kind: "license" as const,
    name: licenseName(spdxId),
    abbreviation: spdxId.toUpperCase(),
    count,
    examine: `A stack of exactly ${exactCount(count)} repositories bearing the ${spdxId} license.`
  })));
}

function supplyItem(kind: "language" | "topic", entry: CountedName): BackpackItem | null {
  const name = entry.name.trim();
  const count = normaliseCount(entry.count);
  if (!name || count === 0) return null;
  return {
    id: `${kind}:${name.toLowerCase()}`,
    kind,
    name: kind === "language" ? `${name} Runes` : `${name} Map`,
    abbreviation: name.slice(0, 3).toUpperCase(),
    count,
    examine: kind === "language"
      ? `Runes drawn from exactly ${exactCount(count)} ${name} repositories.`
      : `A map marked by exactly ${exactCount(count)} ${name} topic declarations.`
  };
}

function buildSupplyItems(
  languageCounts: CountedName[],
  topicCounts: CountedName[]
): BackpackItem[] {
  const items = [
    ...languageCounts.map((entry) => supplyItem("language", entry)),
    ...topicCounts.map((entry) => supplyItem("topic", entry))
  ].filter((item): item is BackpackItem => item !== null);

  return items.sort((a, b) =>
    b.count - a.count ||
    a.id.slice(a.id.indexOf(":") + 1).localeCompare(b.id.slice(b.id.indexOf(":") + 1)) ||
    (a.kind === b.kind ? 0 : a.kind === "language" ? -1 : 1)
  );
}

function buildArchiveItems(repos: EquipmentRepoInput[]): BackpackItem[] {
  const count = repos.filter((repo) => repo.archived).length;
  return count === 0 ? [] : [{
    id: "archive:repos",
    kind: "archive",
    name: "Dusty Tomes",
    abbreviation: "AR",
    count,
    examine: `Exactly ${exactCount(count)} archived repositories preserved as dusty tomes.`
  }];
}

function buildTemplateItems(repos: EquipmentRepoInput[]): BackpackItem[] {
  const count = repos.filter((repo) => repo.isTemplate).length;
  return count === 0 ? [] : [{
    id: "template:repos",
    kind: "template",
    name: "Template Stamps",
    abbreviation: "TP",
    count,
    examine: `Exactly ${exactCount(count)} repository templates ready to stamp.`
  }];
}

function buildBackpack(input: EquipmentInput): BackpackItem[] {
  const originalStars = input.repos
    .filter((repo) => !repo.fork)
    .reduce((sum, repo) => sum + normaliseCount(repo.stars), 0);
  const gold = calculateReputationGold(input.user.followers, originalStars);
  return [
    currencyItem(gold),
    ...buildLicenseItems(input.repos),
    ...buildSupplyItems(input.languageCounts, input.topicCounts),
    ...buildArchiveItems(input.repos),
    ...buildTemplateItems(input.repos)
  ].slice(0, 28);
}

function accountAgeCape(accountAgeYears: number): string {
  if (accountAgeYears >= 10) return "Ancient Account Cape";
  if (accountAgeYears >= 5) return "Veteran Account Cape";
  if (accountAgeYears >= 1) return "Adventurer Account Cape";
  return "Fresh Account Cape";
}

function formatDate(dateValue: string): string {
  const time = getTime(dateValue);
  if (time === 0) return "Unknown";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(time));
}

function maintenanceSpan(repo: EquipmentRepoInput): number {
  if (!repo.pushedAt) return 0;
  const created = new Date(repo.createdAt).getTime();
  const pushed = new Date(repo.pushedAt).getTime();
  const span = pushed - created;
  return Number.isFinite(span) && span > 0 ? span : 0;
}

function formatSize(sizeKb: number): string {
  const mb = sizeKb / 1024;
  if (mb >= 1) return `${Number(mb.toFixed(1)).toLocaleString()} MB`;
  return `${sizeKb.toLocaleString()} KB`;
}

export function buildEquipment(input: EquipmentInput): CharacterEquipment {
  const repos = input.repos;
  const mostStarred = legacyMaxRepo(repos, (repo) => normaliseCount(repo.stars), true);
  const mostForked = legacyMaxRepo(repos, (repo) => normaliseCount(repo.forks), true);
  const mostRecent = legacyMaxRepo(repos, (repo) => getTime(repo.updatedAt));
  const mostUsedLanguage = [...input.languageCounts].sort(
    (a, b) => normaliseCount(b.count) - normaliseCount(a.count) || a.name.localeCompare(b.name)
  )[0];
  const topTopic = [...input.topicCounts].sort(
    (a, b) => normaliseCount(b.count) - normaliseCount(a.count) || a.name.localeCompare(b.name)
  )[0];

  const mainHand = mostStarred
    ? item(
        "Main hand",
        `Blade of ${mostStarred.name}`,
        normaliseCount(mostStarred.stars) > 0
          ? `${pluralize(normaliseCount(mostStarred.stars), "star")} — most starred work`
          : "Freshly forged, awaiting its first star",
        getMainHandRarity(normaliseCount(mostStarred.stars)),
        mostStarred.htmlUrl
      )
    : fallback("Main hand", "Empty scabbard", "No public repository to forge a blade from");

  const offHand = mostForked
    ? item(
        "Off hand",
        `Aegis of ${mostForked.name}`,
        normaliseCount(mostForked.forks) > 0
          ? `${pluralize(normaliseCount(mostForked.forks), "fork")} — most forked work`
          : "Unscarred, awaiting its first fork",
        getOffHandRarity(normaliseCount(mostForked.forks)),
        mostForked.htmlUrl
      )
    : fallback("Off hand", "Bare arm", "No forked work to raise as a shield");

  const cape = input.prestige.capeSkill
    ? item(
        "Cape",
        `${input.prestige.capeSkill} Skillcape${input.prestige.trimmed ? " (t)" : ""}`,
        input.prestige.trimmed
          ? `Earned at level 99 ${input.prestige.capeSkill}, trimmed by a second mastery`
          : `Earned at level 99 ${input.prestige.capeSkill}`,
        "Legendary"
      )
    : item(
        "Cape",
        accountAgeCape(input.accountAgeYears),
        input.accountAgeYears >= 1
          ? `Woven over ${Math.floor(input.accountAgeYears).toLocaleString()} year${Math.floor(input.accountAgeYears) === 1 ? "" : "s"} of service`
          : "Freshly woven this very year",
        getCapeRarity(input.accountAgeYears)
      );

  const amulet = mostUsedLanguage
    ? item(
        "Amulet",
        `${mostUsedLanguage.name} Amulet`,
        `Attuned through ${mostUsedLanguage.count.toLocaleString()} ${mostUsedLanguage.count === 1 ? "repository" : "repositories"}`,
        getAmuletRarity(input.languageCounts.length)
      )
    : fallback("Amulet", "Unattuned Amulet", "No dominant tongue detected");

  const ring = mostRecent
    ? item(
        "Ring",
        `Signet of ${mostRecent.name}`,
        `Last touched ${formatDate(mostRecent.updatedAt)}`,
        getRingRarity(mostRecent.updatedAt, input.now),
        mostRecent.htmlUrl
      )
    : fallback("Ring", "Bare finger", "No recent work to seal");

  const head = topTopic
    ? item(
        "Head",
        `Helm of ${topTopic.name}`,
        `Their declared field of study (used on ${topTopic.count} quests)`,
        getHeadRarity(normaliseCount(topTopic.count))
      )
    : fallback("Head", "Unadorned Hood", "No field of study declared");

  const bodyRepo = maxRepo(
    repos.filter((repo) => normaliseCount(repo.sizeKb) > 0),
    (repo) => normaliseCount(repo.sizeKb)
  );
  const body = bodyRepo
    ? item(
        "Body",
        `Breastplate of ${bodyRepo.name}`,
        `${formatSize(normaliseCount(bodyRepo.sizeKb))} of hammered code`,
        getBodyRarity(normaliseCount(bodyRepo.sizeKb) / 1024),
        bodyRepo.htmlUrl
      )
    : fallback("Body", "Cloth Tunic", "Travelling light");

  const legsRepo = maxRepo(repos.filter((repo) => maintenanceSpan(repo) > 0), maintenanceSpan);
  const legDays = legsRepo ? maintenanceSpan(legsRepo) / (24 * 60 * 60 * 1000) : 0;
  const legDuration = legDays < 365.25
    ? `${Math.max(1, Math.floor(legDays / 30.4375))} month${Math.max(1, Math.floor(legDays / 30.4375)) === 1 ? "" : "s"}`
    : `${Math.floor(legDays / 365.25)} year${Math.floor(legDays / 365.25) === 1 ? "" : "s"}`;
  const legs = legsRepo
    ? item(
        "Legs",
        `Greaves of ${legsRepo.name}`,
        `Maintained for ${legDuration}`,
        getLegsRarity(legDays / 365.25),
        legsRepo.htmlUrl
      )
    : fallback("Legs", "Patched Trousers", "Every journey starts somewhere");

  const handsRepo = maxRepo(
    repos.filter((repo) => normaliseCount(repo.openIssuesCount) > 0),
    (repo) => normaliseCount(repo.openIssuesCount)
  );
  const hands = handsRepo
    ? item(
        "Hands",
        `Gauntlets of ${handsRepo.name}`,
        `Grappling ${pluralize(normaliseCount(handsRepo.openIssuesCount), "open issue")} & pull requests`,
        getHandsRarity(normaliseCount(handsRepo.openIssuesCount)),
        handsRepo.htmlUrl
      )
    : fallback("Hands", "Bare Hands", "No open quarrels");

  const uniqueTopicCount = input.topicCounts.length;
  const feet = uniqueTopicCount > 0
    ? item(
        "Feet",
        "Boots of Wandering",
        `Trodden through ${uniqueTopicCount} topics`,
        getFeetRarity(uniqueTopicCount)
      )
    : fallback("Feet", "Barefoot", "The grass is soft here");

  const publicGists = normaliseCount(input.user.publicGists);
  const ammo = publicGists > 0
    ? item(
        "Ammo",
        "Quiver of Gists",
        `${publicGists} snippets nocked and loosed`,
        getAmmoRarity(publicGists)
      )
    : fallback("Ammo", "Empty Quiver", "No gists loosed");

  const bySlot: Record<EquipmentSlot, EquipmentItem> = {
    Head: head,
    Cape: cape,
    Amulet: amulet,
    Ammo: ammo,
    "Main hand": mainHand,
    Body: body,
    "Off hand": offHand,
    Legs: legs,
    Hands: hands,
    Feet: feet,
    Ring: ring
  };

  return { items: EQUIPMENT_SLOT_ORDER.map((slot) => bySlot[slot]), backpack: buildBackpack(input) };
}
