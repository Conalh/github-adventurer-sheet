import { useEffect, useState, type FormEvent } from "react";
import {
  GitHubCharacterError,
  formatDate,
  getGitHubCharacter,
  parseGitHubUsername,
  type CharacterSheet,
  type GitHubCharacterErrorKind
} from "./lib/githubCharacter";
import { AdventurerCard } from "./components/AdventurerCard";
import { AchievementHall } from "./components/AchievementHall";
import { EquipmentPanel } from "./components/EquipmentPanel";
import { QuestLog } from "./components/QuestLog";
import { SkillGrid } from "./components/SkillGrid";
import { ErrorState, LoadingState } from "./components/StatePanels";
import {
  BackpackIcon,
  CheckIcon,
  CrestIcon,
  LinkIcon,
  ScrollIcon,
  SwordIcon,
  TrophyIcon
} from "./components/icons";
import { Embers, Flourish, Panel, PanelHeading } from "./components/ui";

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

      <header className="topbar">
        <button className="brand-button" type="button" onClick={navigateToDemo}>
          <span className="brand-crest" aria-hidden="true">
            <CrestIcon />
          </span>
          GitHub Adventurer Sheet
        </button>
        <SearchForm
          initialValue={route.username}
          onNavigate={navigateToCharacter}
          compact
        />
      </header>

      <main className="page-frame">
        <section className="hero" aria-labelledby="hero-title">
          <p className="section-kicker">✦ The Character Forge ✦</p>
          <h1 id="hero-title">Every repo leaves a mark</h1>
          <p className="hero-sub">
            Summon any public GitHub profile as a fantasy adventurer — skills,
            quests, relics, and deeds, all computed from real data.
          </p>
          <SearchForm
            initialValue={route.kind === "demo" ? "" : route.username}
            onNavigate={navigateToCharacter}
          />
          <Flourish />
        </section>

        <CharacterPage
          username={route.username}
          isDemo={route.kind === "demo"}
        />
      </main>

      <footer className="site-footer">
        <p>
          Forged from the public GitHub API · No login, no tracking · Levels are
          deterministic, honor is earned
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
        <CharacterSheetView sheet={loadState.sheet} isDemo={isDemo} />
      ) : null}
    </>
  );
}

function SearchForm({
  initialValue,
  onNavigate,
  compact = false
}: {
  initialValue: string;
  onNavigate: (username: string) => void;
  compact?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");
  const inputId = compact ? "topbar-github-profile" : "github-profile";

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
    <form
      className={compact ? "search-form search-form-compact" : "search-form"}
      onSubmit={handleSubmit}
    >
      <label htmlFor={inputId}>GitHub username or profile URL</label>
      <div className="search-row">
        <input
          id={inputId}
          type="text"
          value={value}
          placeholder="ConalH or https://github.com/ConalH"
          onChange={(event) => setValue(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit">Summon</button>
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function CharacterSheetView({
  sheet,
  isDemo
}: {
  sheet: CharacterSheet;
  isDemo: boolean;
}) {
  const profileFacts = [
    ["Location", sheet.user.location || "Unlisted"],
    ["Company", sheet.user.company || "Unlisted"],
    ["Blog", sheet.user.blog || "Unlisted"],
    ["Joined", formatDate(sheet.user.created_at)],
    ["Followers", sheet.user.followers.toLocaleString()],
    ["Following", sheet.user.following.toLocaleString()],
    ["Public repos", sheet.user.public_repos.toLocaleString()]
  ];

  return (
    <div className="character-grid">
      <div className="card-area">
        <AdventurerCard sheet={sheet} isDemo={isDemo} />
      </div>

      <div className="side-stack">
        <Panel className="identity-summary" aria-labelledby="identity-summary-title">
          <div className="summary-headline">
            <h2 id="identity-summary-title">
              {sheet.strongestSkill} specialist
            </h2>
            <ShareButton username={sheet.user.login} />
          </div>
          {sheet.user.bio ? <p className="bio">{sheet.user.bio}</p> : null}
          <div className="level-runes" aria-label="Character levels">
            <div>
              <span>Combat</span>
              <strong>{sheet.combatLevel}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{sheet.totalLevel}</strong>
            </div>
            <div>
              <span>Quests</span>
              <strong>{sheet.metrics.totalRepos}</strong>
            </div>
          </div>
          <dl className="fact-list">
            {profileFacts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  {label === "Blog" && value !== "Unlisted" ? (
                    <a href={toExternalUrl(value)} target="_blank" rel="noreferrer">
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel className="equipment-panel" aria-labelledby="equipment-title">
          <PanelHeading
            id="equipment-title"
            icon={<BackpackIcon />}
            title="Equipment"
            note="Relics earned through real works"
          />
          <EquipmentPanel sheet={sheet} />
        </Panel>
      </div>

      <Panel className="skills-panel" aria-labelledby="skills-title">
        <PanelHeading
          id="skills-title"
          icon={<SwordIcon />}
          title="Skills"
          note={`${sheet.metrics.totalRepos.toLocaleString()} public quests scanned`}
        />
        <SkillGrid sheet={sheet} />
      </Panel>

      <Panel className="achievement-panel" aria-labelledby="achievements-title">
        <PanelHeading
          id="achievements-title"
          icon={<TrophyIcon />}
          title="Hall of Deeds"
          note="Achievements measured from the public record"
        />
        <AchievementHall sheet={sheet} />
      </Panel>

      <Panel className="quest-panel" aria-labelledby="quest-title">
        <PanelHeading
          id="quest-title"
          icon={<ScrollIcon />}
          title="Quest Log"
          note="Top repositories by stars, forks, and recency"
        />
        <QuestLog quests={sheet.quests} />
      </Panel>
    </div>
  );
}

function ShareButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    const url = `${window.location.origin}/character/${encodeURIComponent(
      username
    )}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copy this character sheet link:", url);
    }
  };

  return (
    <button
      type="button"
      className={copied ? "share-button copied" : "share-button"}
      onClick={handleCopy}
    >
      <span className="meta-icon" aria-hidden="true">
        {copied ? <CheckIcon /> : <LinkIcon />}
      </span>
      {copied ? "Link copied" : "Share sheet"}
    </button>
  );
}

function toExternalUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}
