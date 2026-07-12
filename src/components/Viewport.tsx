import type { CharacterSheet } from "../lib/githubCharacter";

export function Viewport({ sheet }: { sheet: CharacterSheet }) {
  const displayName = sheet.user.name || sheet.user.login;
  const overhead = sheet.user.bio
    ? truncate(sheet.user.bio, 90)
    : "Every repo leaves a mark.";

  return (
    <div className="viewport" aria-label="Character scene">
      <div className="scene-sky" aria-hidden="true" />
      <div className="scene-hills" aria-hidden="true" />
      <div className="scene-ground" aria-hidden="true" />

      <div className="minimap" aria-hidden="true">
        <span className="minimap-blob a" />
        <span className="minimap-blob b" />
        <span className="minimap-path" />
        <span className="minimap-dot" />
        <span className="minimap-compass">N</span>
      </div>

      <div className="player">
        <p className="overhead-text">{overhead}</p>
        <div className="player-portrait">
          {sheet.user.avatar_url ? (
            <img
              src={pixelAvatar(sheet.user.avatar_url)}
              alt={`${displayName} GitHub avatar, pixelated like a game character`}
              className="player-avatar"
              width={220}
              height={220}
            />
          ) : (
            <div className="player-avatar avatar-fallback" aria-label="No GitHub avatar">
              {sheet.user.login.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
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
