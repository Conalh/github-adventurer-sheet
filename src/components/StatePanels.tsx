import type { GitHubCharacterErrorKind } from "../lib/githubCharacter";
import { Panel } from "./ui";

export function LoadingState({ username }: { username: string }) {
  return (
    <Panel className="state-panel" aria-busy="true" aria-live="polite">
      <div className="rune-spinner" aria-hidden="true">
        <span className="rune-ring" />
        <span className="rune-ring inner" />
        <span className="rune-core">✦</span>
      </div>
      <p className="section-kicker">Consulting the GitHub oracles</p>
      <h2>Summoning @{username}</h2>
      <p className="state-note">
        Reading public repositories, weighing stars, appraising relics…
      </p>
      <div className="skeleton-grid" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
    </Panel>
  );
}

export function ErrorState({
  kind,
  message,
  username,
  onRetry
}: {
  kind: GitHubCharacterErrorKind;
  message: string;
  username: string;
  onRetry: () => void;
}) {
  const titleByKind: Record<GitHubCharacterErrorKind, string> = {
    invalid_username: "Invalid adventurer name",
    not_found: "Adventurer not found",
    rate_limit: "The oracles need rest",
    network: "The path is blocked",
    generic: "The summoning failed"
  };

  return (
    <Panel className="state-panel error-state" role="alert">
      <div className="error-sigil" aria-hidden="true">
        ✕
      </div>
      <p className="section-kicker">Could not summon @{username}</p>
      <h2>{titleByKind[kind]}</h2>
      <p className="state-note">{message}</p>
      <button type="button" className="retry-button" onClick={onRetry}>
        Cast again
      </button>
    </Panel>
  );
}
