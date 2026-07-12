import type { CSSProperties } from "react";
import type { CharacterQuest } from "../lib/githubCharacter";
import { EyeIcon, ForkIcon, StarIcon } from "./icons";

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#4d8fd6",
  JavaScript: "#f1e05a",
  Python: "#5c9edb",
  Java: "#c98a4b",
  "C#": "#4fc46a",
  "C++": "#f34b7d",
  C: "#9aa3ab",
  Go: "#37c3e1",
  Rust: "#dea584",
  Ruby: "#e05555",
  PHP: "#8892bf",
  Swift: "#f05138",
  Kotlin: "#a97bff",
  Dart: "#41c4b8",
  HTML: "#e34c26",
  CSS: "#8f6fd0",
  SCSS: "#c6538c",
  Shell: "#89e051",
  PowerShell: "#5391fe",
  Vue: "#41b883",
  Svelte: "#ff5d2e",
  Lua: "#7d9ae8",
  Haskell: "#8a7bb8",
  Elixir: "#b58fc7",
  Zig: "#ec915c",
  GDScript: "#6fa8cf",
  "Jupyter Notebook": "#e0782d",
  Unknown: "#b9a86a"
};

export function QuestLog({ quests }: { quests: CharacterQuest[] }) {
  if (quests.length === 0) {
    return (
      <div className="empty-state">
        <h3>No public quests recorded</h3>
        <p>
          This adventurer keeps their deeds hidden — no public repositories are
          available through the GitHub API.
        </p>
      </div>
    );
  }

  return (
    <ol className="quest-list">
      {quests.map((quest, index) => (
        <li key={quest.repo.id} className="quest-card">
          <div
            className={`quest-gem difficulty-${quest.difficulty.toLowerCase()}`}
            aria-hidden="true"
          >
            <span>{toRomanNumeral(index + 1)}</span>
          </div>

          <div className="quest-body">
            <div className="quest-titleline">
              <h3>
                <a href={quest.repo.html_url} target="_blank" rel="noreferrer">
                  {quest.repo.name}
                </a>
              </h3>
              <span
                className={`difficulty-ribbon difficulty-${quest.difficulty.toLowerCase()}`}
              >
                {quest.difficulty}
              </span>
            </div>
            <p className="quest-description">{quest.description}</p>
            <ul className="quest-meta" aria-label="Quest details">
              <li
                className="language-chip"
                style={
                  {
                    "--language-color":
                      LANGUAGE_COLORS[quest.language] ?? LANGUAGE_COLORS.Unknown
                  } as CSSProperties
                }
              >
                <i aria-hidden="true" />
                {quest.language}
              </li>
              <li>
                <span className="meta-icon" aria-hidden="true">
                  <StarIcon />
                </span>
                {quest.repo.stargazers_count.toLocaleString()} stars
              </li>
              <li>
                <span className="meta-icon" aria-hidden="true">
                  <ForkIcon />
                </span>
                {quest.repo.forks_count.toLocaleString()} forks
              </li>
              <li>
                <span className="meta-icon" aria-hidden="true">
                  <EyeIcon />
                </span>
                Updated {quest.updatedLabel}
              </li>
            </ul>
          </div>
        </li>
      ))}
    </ol>
  );
}

function toRomanNumeral(value: number): string {
  const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  return numerals[value - 1] ?? String(value);
}
