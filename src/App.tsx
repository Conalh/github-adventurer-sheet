import {
  type CSSProperties,
  type FormEvent,
  useEffect,
  useState
} from "react";
import {
  type CharacterQuest,
  type CharacterSheet,
  type GitHubCharacterErrorKind,
  type SkillName,
  GitHubCharacterError,
  SKILL_NAMES,
  formatDate,
  getGitHubCharacter,
  parseGitHubUsername
} from "./lib/githubCharacter";

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
      <header className="topbar">
        <button className="brand-button" type="button" onClick={navigateToDemo}>
          GitHub Adventurer Sheet
        </button>
        <SearchForm
          initialValue={route.username}
          onNavigate={navigateToCharacter}
          compact
        />
      </header>

      <CharacterPage
        username={route.username}
        isDemo={route.kind === "demo"}
      />
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
  }, [username]);

  return (
    <main className="page-frame">
      <section className="summon-panel" aria-labelledby="summon-title">
        <div className="summon-copy">
          <p className="section-kicker">GitHub character forge</p>
          <h1 id="summon-title">Roll a GitHub hero.</h1>
          <p>Every repo leaves a mark.</p>
        </div>
      </section>

      {loadState.status === "loading" ? <LoadingState username={username} /> : null}

      {loadState.status === "error" ? (
        <ErrorState
          kind={loadState.kind}
          message={loadState.message}
          username={username}
        />
      ) : null}

      {loadState.status === "loaded" ? (
        <CharacterSheetView sheet={loadState.sheet} isDemo={isDemo} />
      ) : null}
    </main>
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
  const displayName = sheet.user.name || sheet.user.login;
  const profileFacts = [
    ["Location", sheet.user.location || "Unlisted"],
    ["Company", sheet.user.company || "Unlisted"],
    ["Blog", sheet.user.blog || "Unlisted"],
    ["Joined", formatDate(sheet.user.created_at)],
    ["Followers", sheet.user.followers.toLocaleString()],
    ["Following", sheet.user.following.toLocaleString()],
    ["Public repos", sheet.user.public_repos.toLocaleString()]
  ];
  const cardStats: Array<[SkillName, string]> = [
    ["Attack", "ATK"],
    ["Strength", "STR"],
    ["Defence", "DEF"],
    ["Ranged", "RNG"],
    ["Magic", "MAG"],
    ["Crafting", "CRF"]
  ];

  return (
    <div className="character-grid">
      <section className="adventurer-card" aria-labelledby="character-name">
        <div className="card-topline">
          <div>
            <strong>{sheet.combatLevel}</strong>
            <span>CBT</span>
          </div>
          <div>
            <strong>{sheet.totalLevel}</strong>
            <span>TOTAL</span>
          </div>
        </div>

        <div className="portrait-shell">
          {sheet.user.avatar_url ? (
            <img
              src={sheet.user.avatar_url}
              alt={`${displayName} GitHub avatar`}
              className="avatar"
            />
          ) : (
            <div className="avatar avatar-fallback" aria-label="No GitHub avatar">
              {sheet.user.login.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="identity-copy">
          {isDemo ? <p className="section-kicker">Default demo</p> : null}
          <p className="class-title">{sheet.characterClass}</p>
          <h2 id="character-name">{displayName}</h2>
          <a href={sheet.user.html_url} target="_blank" rel="noreferrer">
            @{sheet.user.login}
          </a>
        </div>

        <dl className="card-stat-grid" aria-label="Primary GitHub character stats">
          {cardStats.map(([skill, label]) => (
            <div key={skill}>
              <dt>{label}</dt>
              <dd>{sheet.skills[skill]}</dd>
            </div>
          ))}
        </dl>

        <p className="card-footer">GITHUB QUEST CARD</p>
      </section>

      <div className="side-stack">
        <section className="panel identity-summary" aria-labelledby="identity-summary">
          <h2 id="identity-summary">{sheet.strongestSkill} specialist</h2>
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
              <span>Repos</span>
              <strong>{sheet.metrics.totalRepos}</strong>
            </div>
          </div>
        </section>

        <section className="panel metadata-panel" aria-labelledby="profile-metadata">
          <h2 id="profile-metadata">Profile Ledger</h2>
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
        </section>

        <section className="panel equipment-panel" aria-labelledby="equipment-title">
          <h2 id="equipment-title">Equipment</h2>
          <EquipmentList sheet={sheet} />
        </section>
      </div>

      <section className="panel skills-panel" aria-labelledby="skills-title">
        <div className="panel-heading">
          <h2 id="skills-title">Skill Table</h2>
          <p>{sheet.metrics.totalRepos.toLocaleString()} public quests scanned</p>
        </div>
        <SkillTable sheet={sheet} />
      </section>

      <section className="panel quest-panel" aria-labelledby="quest-title">
        <div className="panel-heading">
          <h2 id="quest-title">Quest Log</h2>
          <p>Top repositories by stars, forks, and recent activity</p>
        </div>
        <QuestLog quests={sheet.quests} />
      </section>
    </div>
  );
}

function SkillTable({ sheet }: { sheet: CharacterSheet }) {
  return (
    <div className="table-wrap">
      <table className="skill-table">
        <caption>Deterministic GitHub-to-character skill levels</caption>
        <thead>
          <tr>
            <th scope="col">Skill</th>
            <th scope="col">Level</th>
            <th scope="col">Signal</th>
          </tr>
        </thead>
        <tbody>
          {SKILL_NAMES.map((skill) => (
            <tr key={skill}>
              <th scope="row">{skill}</th>
              <td>{sheet.skills[skill]}</td>
              <td>
                <SkillMeter skill={skill} level={sheet.skills[skill]} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SkillMeter({ skill, level }: { skill: SkillName; level: number }) {
  return (
    <div
      className="skill-meter"
      aria-label={`${skill} level ${level} of 99`}
      style={{ "--skill-level": `${level}%` } as CSSProperties}
    >
      <span />
    </div>
  );
}

function EquipmentList({ sheet }: { sheet: CharacterSheet }) {
  const equipment = [
    ["Main hand", sheet.equipment.mainHand],
    ["Off hand", sheet.equipment.offHand],
    ["Cape", sheet.equipment.cape],
    ["Amulet", sheet.equipment.amulet],
    ["Ring", sheet.equipment.ring]
  ];

  return (
    <>
      <dl className="equipment-list">
        {equipment.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="backpack">
        <h3>Backpack</h3>
        <ul>
          {sheet.equipment.backpack.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

function QuestLog({ quests }: { quests: CharacterQuest[] }) {
  if (quests.length === 0) {
    return (
      <div className="empty-state">
        <h3>No public quests recorded</h3>
        <p>This profile has no public repositories available through the GitHub API.</p>
      </div>
    );
  }

  return (
    <ol className="quest-list">
      {quests.map((quest) => (
        <li key={quest.repo.id} className="quest-card">
          <div>
            <h3>
              <a href={quest.repo.html_url} target="_blank" rel="noreferrer">
                {quest.repo.name}
              </a>
            </h3>
            <p>{quest.description}</p>
          </div>
          <dl className="quest-stats">
            <div>
              <dt>Difficulty</dt>
              <dd>
                {quest.difficulty} ({quest.difficultyScore})
              </dd>
            </div>
            <div>
              <dt>Language</dt>
              <dd>{quest.language}</dd>
            </div>
            <div>
              <dt>Stars</dt>
              <dd>{quest.repo.stargazers_count.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Forks</dt>
              <dd>{quest.repo.forks_count.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{quest.updatedLabel}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ol>
  );
}

function LoadingState({ username }: { username: string }) {
  return (
    <section className="state-panel" aria-busy="true" aria-live="polite">
      <p className="section-kicker">Consulting GitHub</p>
      <h2>Building @{username}</h2>
      <div className="skeleton-grid" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

function ErrorState({
  kind,
  message,
  username
}: {
  kind: GitHubCharacterErrorKind;
  message: string;
  username: string;
}) {
  const titleByKind: Record<GitHubCharacterErrorKind, string> = {
    invalid_username: "Invalid adventurer name",
    not_found: "Adventurer not found",
    rate_limit: "GitHub rate limit reached",
    network: "Network path blocked",
    generic: "Character sheet failed"
  };

  return (
    <section className="state-panel error-state" role="alert">
      <p className="section-kicker">Could not summon @{username}</p>
      <h2>{titleByKind[kind]}</h2>
      <p>{message}</p>
    </section>
  );
}

function toExternalUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}
