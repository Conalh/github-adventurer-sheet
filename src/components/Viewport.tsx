import { skillXpFromScore, type CharacterSheet } from "../lib/githubCharacter";
import {
  getRealmDestinationName,
  getRealmForPrestige,
  getRealmImpact,
} from "../lib/realm";
import type { ChatMessage } from "./Chatbox";
import { ContextMenuButton } from "./ContextMenuButton";
import { CrownIcon, HeartIcon, SunburstIcon } from "./icons";
import { RealmScene } from "./RealmScene";
import { SkillcapeArt } from "./SkillcapeArt";
import { TrophyWall } from "./TrophyWall";

export function Viewport({
  sheet,
  say
}: {
  sheet: CharacterSheet;
  say: (kind: ChatMessage["kind"], text: string) => void;
}) {
  const displayName = sheet.user.name || sheet.user.login;
  const overhead = sheet.user.bio
    ? truncate(sheet.user.bio, 90)
    : "Every repo leaves a mark.";
  const { prestige } = sheet;
  const realm = getRealmForPrestige(prestige.tier);
  const destination = getRealmDestinationName(realm);
  const impact = getRealmImpact(
    prestige.tier,
    sheet.metrics,
    sheet.user.followers,
  );

  return (
    <div
      className={`viewport realm-${realm.id}`}
      data-realm-tier={prestige.tier}
      data-realm={realm.id}
      aria-label={`${realm.name} character scene`}
    >
      <RealmScene tier={prestige.tier} />
      <section
        className="realm-plaque"
        aria-label={`${realm.name} profile impact`}
      >
        <span className="realm-instance">World 404 · {realm.instanceLabel}</span>
        <strong>{realm.name}</strong>
        <span className="realm-impact">
          {impact.map((entry) => (
            <span className="realm-impact-item" key={entry.label}>
              <b>{entry.value}</b> {entry.label}
            </span>
          ))}
        </span>
      </section>
      <TrophyWall displays={sheet.trophyRoom.displays} say={say} />

      <div className="player">
        <p className="overhead-text">{overhead}</p>
        {prestige.capeSkill ? (
          <span className="xp-drop" aria-hidden="true">
            +{skillXpFromScore(sheet.skillScores[prestige.capeSkill]).toLocaleString()}{" "}
            xp
          </span>
        ) : null}
        <ContextMenuButton
          type="button"
          className="player-hitbox"
          aria-label={`${displayName} — choose option`}
          items={[
            {
              id: "walk",
              label: "Walk here",
              onSelect: () =>
                say(
                  "game",
                  `You cross ${destination}. The commit history follows you.`,
                ),
            },
            {
              id: "examine",
              label: "Examine",
              target: displayName,
              onSelect: () =>
                say(
                  "examine",
                  `${displayName}: a ${sheet.characterClass.toLowerCase()} of combat level ${sheet.combatLevel}. ${
                    sheet.user.bio || "They keep their scrolls close."
                  }`,
                ),
            },
            {
              id: "trade",
              label: "Trade with",
              target: displayName,
              onSelect: () => {
                window.open(sheet.user.html_url, "_blank", "noreferrer");
                say(
                  "game",
                  `Sending trade offer to ${displayName}… they are busy on GitHub.`,
                );
              },
            },
          ]}
        >
          <span className="player-portrait">
            {prestige.capeSkill ? (
              <span className={prestige.trimmed ? "skillcape trimmed" : "skillcape"} aria-hidden="true">
                <SkillcapeArt
                  skill={prestige.capeSkill}
                  trimmed={prestige.trimmed}
                  variant="worn"
                />
              </span>
            ) : null}
            {sheet.user.avatar_url ? (
              <img
                src={pixelAvatar(sheet.user.avatar_url)}
                alt=""
                className="player-avatar"
                width={165}
                height={165}
              />
            ) : (
              <span className="player-avatar avatar-fallback">
                {sheet.user.login.slice(0, 2).toUpperCase()}
              </span>
            )}
          </span>
        </ContextMenuButton>

        <div className="character-caption">
          <p className="nameplate">
            {prestige.tier >= 2 ? (
              <span
                className={
                  prestige.tier >= 3 ? "prestige-crown gold" : "prestige-crown silver"
                }
                title={`${prestige.title} of the realm`}
                aria-label={`${prestige.title} of the realm`}
              >
                <CrownIcon />
              </span>
            ) : null}
            <a href={sheet.user.html_url} target="_blank" rel="noreferrer">
              {displayName}
            </a>{" "}
            <span className="nameplate-level">(level-{sheet.combatLevel})</span>
          </p>
          <p className="class-line">
            {prestige.title ? `${prestige.title} ` : ""}
            {sheet.characterClass}
          </p>
        </div>

        <div className="status-orbs">
          <div
            className="orb hp"
            title={`Hitpoints: ${sheet.skills.Hitpoints}`}
            aria-label={`Hitpoints ${sheet.skills.Hitpoints}`}
          >
            <span className="orb-num">{sheet.skills.Hitpoints}</span>
            <span className="orb-globe" aria-hidden="true"><HeartIcon /></span>
          </div>
          <div
            className="orb prayer"
            title={`Prayer: ${sheet.skills.Prayer}`}
            aria-label={`Prayer ${sheet.skills.Prayer}`}
          >
            <span className="orb-num">{sheet.skills.Prayer}</span>
            <span className="orb-globe" aria-hidden="true"><SunburstIcon /></span>
          </div>
        </div>
      </div>

      <p className="build-tag" aria-hidden="true">
        Sheet build {sheet.totalLevel}
      </p>
    </div>
  );
}

function pixelAvatar(avatarUrl: string): string {
  const separator = avatarUrl.includes("?") ? "&" : "?";
  return `${avatarUrl}${separator}s=460`;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}
