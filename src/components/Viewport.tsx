import { useEffect, useState } from "react";
import { skillXpFromScore, type CharacterSheet } from "../lib/githubCharacter";
import type { ChatMessage } from "./Chatbox";
import { CrownIcon, HeartIcon, SunburstIcon } from "./icons";
import { SkillcapeArt } from "./SkillcapeArt";
import { TrophyWall } from "./TrophyWall";

export function Viewport({
  sheet,
  say
}: {
  sheet: CharacterSheet;
  say: (kind: ChatMessage["kind"], text: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName = sheet.user.name || sheet.user.login;
  const overhead = sheet.user.bio
    ? truncate(sheet.user.bio, 90)
    : "Every repo leaves a mark.";
  const { prestige } = sheet;
  const grandmaster = prestige.tier >= 3;

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [menuOpen]);

  const chooseOption = (message: [ChatMessage["kind"], string] | null) => {
    setMenuOpen(false);

    if (message) {
      say(message[0], message[1]);
    }
  };

  return (
    <div
      className={grandmaster ? "viewport grandmaster" : "viewport"}
      aria-label="Character scene"
    >
      <div className="inn-back-wall" aria-hidden="true">
        <span className="inn-stonework" />
        <span className="inn-beam beam-left" />
        <span className="inn-beam beam-right" />
        <span className="inn-beam beam-top" />
        <span className="inn-banner banner-left" />
        <span className="inn-banner banner-right" />
      </div>
      <TrophyWall displays={sheet.trophyRoom.displays} />
      <span className="inn-hearth" aria-hidden="true">
        <i className="hearth-mantle" />
        <i className="hearth-fire" />
      </span>
      <div className="inn-floor" aria-hidden="true" />

      <div className="status-orbs">
        <div
          className="orb hp"
          title={`Hitpoints: ${sheet.skills.Hitpoints}`}
          aria-label={`Hitpoints ${sheet.skills.Hitpoints}`}
        >
          <span className="orb-num">{sheet.skills.Hitpoints}</span>
          <span className="orb-globe" aria-hidden="true">
            <HeartIcon />
          </span>
        </div>
        <div
          className="orb prayer"
          title={`Prayer: ${sheet.skills.Prayer}`}
          aria-label={`Prayer ${sheet.skills.Prayer}`}
        >
          <span className="orb-num">{sheet.skills.Prayer}</span>
          <span className="orb-globe" aria-hidden="true">
            <SunburstIcon />
          </span>
        </div>
      </div>

      <div className="player">
        <p className="overhead-text">{overhead}</p>
        {prestige.capeSkill ? (
          <span className="xp-drop" aria-hidden="true">
            +{skillXpFromScore(sheet.skillScores[prestige.capeSkill]).toLocaleString()}{" "}
            xp
          </span>
        ) : null}
        <button
          type="button"
          className="player-hitbox"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={`${displayName} — choose option`}
          onClick={() => setMenuOpen((open) => !open)}
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
                width={220}
                height={220}
              />
            ) : (
              <span className="player-avatar avatar-fallback">
                {sheet.user.login.slice(0, 2).toUpperCase()}
              </span>
            )}
          </span>
        </button>

        {menuOpen ? (
          <div className="context-menu" role="menu" aria-label="Choose option">
            <p className="context-title">Choose Option</p>
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                chooseOption([
                  "game",
                  "You cross to the other side of the inn. The commit history follows you."
                ])
              }
            >
              Walk here
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                chooseOption([
                  "examine",
                  `${displayName}: a ${sheet.characterClass.toLowerCase()} of combat level ${sheet.combatLevel}. ${
                    sheet.user.bio || "They keep their scrolls close."
                  }`
                ])
              }
            >
              Examine <span className="context-target">{displayName}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                window.open(sheet.user.html_url, "_blank", "noreferrer");
                chooseOption([
                  "game",
                  `Sending trade offer to ${displayName}… they are busy on GitHub.`
                ]);
              }}
            >
              Trade with <span className="context-target">{displayName}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => chooseOption(null)}
            >
              Cancel
            </button>
          </div>
        ) : null}

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

      <p className="build-tag" aria-hidden="true">
        Sheet build {sheet.totalLevel}
      </p>
    </div>
  );
}

function pixelAvatar(avatarUrl: string): string {
  const separator = avatarUrl.includes("?") ? "&" : "?";
  return `${avatarUrl}${separator}s=96`;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}
