import { useEffect, useState } from "react";
import type { CharacterSheet } from "../lib/githubCharacter";
import type { ChatMessage } from "./Chatbox";
import { HeartIcon, SunburstIcon } from "./icons";

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
    <div className="viewport" aria-label="Character scene">
      <div className="scene-sky" aria-hidden="true" />
      <span className="scene-stars" aria-hidden="true" />
      <div className="scene-hills" aria-hidden="true" />
      <div className="scene-ground" aria-hidden="true" />

      <span className="scene-tree left" aria-hidden="true">
        <i className="canopy" />
        <i className="trunk" />
      </span>
      <span className="scene-tree right" aria-hidden="true">
        <i className="canopy" />
        <i className="trunk" />
      </span>
      <span className="scene-rock a" aria-hidden="true" />
      <span className="scene-rock b" aria-hidden="true" />

      <span className="campfire" aria-hidden="true">
        <i className="fire-glow" />
        <i className="log a" />
        <i className="log b" />
        <i className="flame outer" />
        <i className="flame inner" />
      </span>

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

      <div className="minimap" aria-hidden="true">
        <span className="minimap-blob a" />
        <span className="minimap-blob b" />
        <span className="minimap-path" />
        <span className="minimap-dot" />
        <span className="minimap-compass">N</span>
      </div>

      <div className="player">
        <p className="overhead-text">{overhead}</p>
        <button
          type="button"
          className="player-hitbox"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={`${displayName} — choose option`}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="player-portrait">
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
                  "You walk to the other side of the meadow. The commit history follows you."
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
          <a href={sheet.user.html_url} target="_blank" rel="noreferrer">
            {displayName}
          </a>{" "}
          <span className="nameplate-level">(level-{sheet.combatLevel})</span>
        </p>
        <p className="class-line">{sheet.characterClass}</p>
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
