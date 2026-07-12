import { useEffect, useState, type FormEvent } from "react";
import {
  GitHubCharacterError,
  getGitHubCharacter,
  parseGitHubUsername,
  type CharacterSheet,
  type GitHubCharacterErrorKind
} from "./lib/githubCharacter";
import { GameClient } from "./components/GameClient";
import { ErrorState, LoadingState } from "./components/StatePanels";
import { Embers } from "./components/ui";

const DEMO_USERNAME = "ConalH";

type AppRoute =
  | {
      kind: "demo";
      username: typeof DEMO_USERNAME;
    }
  | {
      kind: "character";
      username: string;
    };

type LoadState =
  | {
      status: "loading";
    }
  | {
      status: "loaded";
      sheet: CharacterSheet;
    }
  | {
      status: "error";
      kind: GitHubCharacterErrorKind;
      message: string;
    };

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() => readRoute());

  useEffect(() => {
    const handlePopState = () => setRoute(readRoute());
    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateToCharacter = (username: string) => {
    const nextPath = `/character/${encodeURIComponent(username)}`;
    window.history.pushState({}, "", nextPath);
    setRoute({ kind: "character", username });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToDemo = () => {
    window.history.pushState({}, "", "/");
    setRoute({ kind: "demo", username: DEMO_USERNAME });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell">
      <div className="backdrop" aria-hidden="true" />
      <Embers />

      <main className="page-frame">
        <header className="masthead">
          <button
            className="wordmark"
            type="button"
            onClick={navigateToDemo}
            aria-label="GitHub Adventurer Sheet — back to the demo hero"
          >
            <span className="wordmark-top">GitHub</span>
            <span className="wordmark-main">Adventurer Sheet</span>
          </button>

          <section className="login-box" aria-label="Summon an adventurer">
            <h1 className="login-title">Enter thy GitHub name to play</h1>
            <SearchForm
              initialValue={route.kind === "demo" ? "" : route.username}
              onNavigate={navigateToCharacter}
            />
          </section>
        </header>

        <CharacterPage
          username={route.username}
          isDemo={route.kind === "demo"}
        />
      </main>

      <footer className="site-footer">
        <p>
          A fan-made parody of a certain beloved MMO's interface. Not
          affiliated with or endorsed by Jagex. All art is original CSS and
          SVG — no game assets were used.
        </p>
        <p>
          Forged from the public GitHub API · No login, no tracking · Levels
          are deterministic, honor is earned.
        </p>
      </footer>
    </div>
  );
}

function readRoute(): AppRoute {
  const match = window.location.pathname.match(/^\/character\/([^/]+)\/?$/);

  if (!match) {
    return { kind: "demo", username: DEMO_USERNAME };
  }

  return {
    kind: "character",
    username: decodeURIComponent(match[1] ?? "")
  };
}

function CharacterPage({
  username,
  isDemo
}: {
  username: string;
  isDemo: boolean;
}) {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoadState({ status: "loading" });
    getGitHubCharacter(username, { signal: controller.signal })
      .then((sheet) => setLoadState({ status: "loaded", sheet }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        if (error instanceof GitHubCharacterError) {
          setLoadState({
            status: "error",
            kind: error.kind,
            message: error.message
          });
          return;
        }

        setLoadState({
          status: "error",
          kind: "generic",
          message: "Something went wrong while building this character sheet."
        });
      });

    return () => controller.abort();
  }, [username, attempt]);

  useEffect(() => {
    if (loadState.status === "loaded") {
      const displayName = loadState.sheet.user.name || loadState.sheet.user.login;
      document.title = `${displayName} — GitHub Adventurer Sheet`;
    } else {
      document.title = "GitHub Adventurer Sheet";
    }
  }, [loadState]);

  return (
    <>
      {loadState.status === "loading" ? (
        <LoadingState username={username} />
      ) : null}

      {loadState.status === "error" ? (
        <ErrorState
          kind={loadState.kind}
          message={loadState.message}
          username={username}
          onRetry={() => setAttempt((count) => count + 1)}
        />
      ) : null}

      {loadState.status === "loaded" ? (
        <GameClient sheet={loadState.sheet} isDemo={isDemo} />
      ) : null}
    </>
  );
}

function SearchForm({
  initialValue,
  onNavigate
}: {
  initialValue: string;
  onNavigate: (username: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");

  useEffect(() => {
    setValue(initialValue);
    setError("");
  }, [initialValue]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const parsed = parseGitHubUsername(value);
      setError("");
      onNavigate(parsed);
    } catch (submitError) {
      if (submitError instanceof GitHubCharacterError) {
        setError(submitError.message);
        return;
      }

      setError("Enter a valid GitHub username or profile URL.");
    }
  };

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <label htmlFor="github-profile" className="visually-hidden">
        GitHub username or profile URL
      </label>
      <div className="search-row">
        <input
          id="github-profile"
          type="text"
          value={value}
          placeholder="ConalH or github.com/ConalH"
          onChange={(event) => setValue(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" className="stone-button">
          Summon
        </button>
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
