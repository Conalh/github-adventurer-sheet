import type { PrestigeTier, RepositoryMetrics } from "./githubCharacter";

export type RealmId = "roadside" | "guild" | "heroes" | "legend";

export type RealmDefinition = {
  id: RealmId;
  name: string;
  instanceLabel: string;
  entrance: string;
};

export type RealmImpact = {
  label: string;
  value: string;
};

const REALMS: Record<PrestigeTier, RealmDefinition> = {
  0: {
    id: "roadside",
    name: "The Roadside Room",
    instanceLabel: "New adventurer instance",
    entrance: "A quiet room has been prepared",
  },
  1: {
    id: "guild",
    name: "The Guild Inn",
    instanceLabel: "Adept instance",
    entrance: "The guild doors open",
  },
  2: {
    id: "heroes",
    name: "The Heroes' Hearth",
    instanceLabel: "Master instance",
    entrance: "The heroes raise their banners",
  },
  3: {
    id: "legend",
    name: "The Hall of Legends",
    instanceLabel: "Grandmaster instance",
    entrance: "The Hall of Legends recognises its guest",
  },
};

export function getRealmForPrestige(tier: PrestigeTier): RealmDefinition {
  return REALMS[tier];
}

export function getRealmDestinationName(realm: RealmDefinition): string {
  return realm.name.replace(/^The /, "the ");
}

export function getRealmImpact(
  tier: PrestigeTier,
  metrics: RepositoryMetrics,
  followers: number,
): RealmImpact[] {
  if (tier >= 2) {
    return [
      { label: "stars", value: metrics.totalStars.toLocaleString("en-US") },
      {
        label: "forks",
        value: metrics.totalForksReceived.toLocaleString("en-US"),
      },
      { label: "followers", value: followers.toLocaleString("en-US") },
    ];
  }

  return [
    {
      label: "public quests",
      value: metrics.totalRepos.toLocaleString("en-US"),
    },
    { label: "followers", value: followers.toLocaleString("en-US") },
  ];
}
