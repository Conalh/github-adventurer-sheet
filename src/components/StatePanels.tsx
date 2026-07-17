import { useEffect, useState } from "react";
import type { GitHubCharacterErrorKind } from "../lib/githubCharacter";

const CONNECTION_PHASES = [
  {
    title: "Connecting to World 404…",
    copy: "Attempting to establish a profile connection for",
    hint: "Checking the public profile server…",
  },
  {
    title: "Loading — please wait.",
    copy: "Retrieving the adventurer record for",
    hint: "Reading repositories and quest records…",
  },
  {
    title: "Preparing character…",
    copy: "Rolling a deterministic character sheet for",
    hint: "Calculating levels, relics, and quest points…",
  },
] as const;

export function LoadingState({ username }: { username: string }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      setPhase(CONNECTION_PHASES.length - 1);
      return;
    }

    setPhase(0);
    const timers = [
      window.setTimeout(() => setPhase(1), 300),
      window.setTimeout(() => setPhase(2), 650),
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [username]);

  const current = CONNECTION_PHASES[phase];

  return (
    <section
      className="login-box state-box connection-state"
      aria-busy="true"
      aria-live="polite"
      data-connection-phase={phase + 1}
    >
      <p className="world-badge">
        <span>World 404</span>
        <span className="world-online">Online</span>
      </p>
      <h2 className="login-title">{current.title}</h2>
      <p className="login-copy">
        {current.copy} <strong>@{username}</strong>.
      </p>
      <div className="connect-bar" aria-hidden="true">
        <span />
      </div>
      <ol className="connection-steps" aria-hidden="true">
        {CONNECTION_PHASES.map((connectionPhase, index) => (
          <li
            key={connectionPhase.title}
            className={index < phase ? "complete" : index === phase ? "active" : ""}
          />
        ))}
      </ol>
      <p className="login-hint">{current.hint}</p>
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
    rate_limit: "This world is full",
    network: "Connection lost",
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
