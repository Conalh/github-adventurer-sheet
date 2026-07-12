import type { GitHubCharacterErrorKind } from "../lib/githubCharacter";

export function LoadingState({ username }: { username: string }) {
  return (
    <section className="login-box state-box" aria-busy="true" aria-live="polite">
      <h2 className="login-title">Connecting to GitHub…</h2>
      <p className="login-copy">
        Summoning <strong>@{username}</strong> from the archives.
      </p>
      <div className="connect-bar" aria-hidden="true">
        <span />
      </div>
      <p className="login-hint">
        Weighing stars, appraising relics, counting quest points…
      </p>
    </section>
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
    rate_limit: "The realm is busy",
    network: "Unable to connect",
    generic: "The summoning failed"
  };

  return (
    <section className="login-box state-box error-box" role="alert">
      <h2 className="login-title error-title">{titleByKind[kind]}</h2>
      <p className="login-copy">
        Could not summon <strong>@{username}</strong>.
      </p>
      <p className="login-hint">{message}</p>
      <button type="button" className="stone-button" onClick={onRetry}>
        Try again
      </button>
    </section>
  );
}
