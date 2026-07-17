import { useState } from "react";
import type {
  CharacterQuest,
  CharacterSheet,
  QuestDifficulty
} from "../../lib/githubCharacter";
import type { ChatMessage } from "../Chatbox";
import { ContextMenuButton } from "../ContextMenuButton";

const QUEST_POINTS: Record<QuestDifficulty, number> = {
  Novice: 1,
  Apprentice: 2,
  Adept: 3,
  Expert: 4,
  Master: 5
};

export function QuestJournalTab({
  sheet,
  say
}: {
  sheet: CharacterSheet;
  say: (kind: ChatMessage["kind"], text: string) => void;
}) {
  const [openQuestId, setOpenQuestId] = useState<number | null>(null);
  const questPoints = sheet.quests.reduce(
    (total, quest) => total + QUEST_POINTS[quest.difficulty],
    0
  );

  if (sheet.quests.length === 0) {
    return (
      <div className="quest-tab">
        <header className="rs-tab-heading">
          <h3>Quest Journal</h3>
          <span className="quest-points">QP: 0</span>
        </header>
        <p className="quest-empty">
          This adventurer keeps their deeds hidden. No public quests were found
          in the archives.
        </p>
      </div>
    );
  }

  const toggleQuest = (quest: CharacterQuest) => {
    const isOpening = openQuestId !== quest.repo.id;
    setOpenQuestId(isOpening ? quest.repo.id : null);

    if (isOpening) {
      say(
        "game",
        `You open "${quest.title}" — the quest record for ${quest.repo.name} (${quest.difficulty.toLowerCase()}).`
      );
    }
  };

  return (
    <div className="quest-tab">
      <header className="rs-tab-heading">
        <h3>Quest Journal</h3>
        <span className="quest-points">QP: {questPoints}</span>
      </header>

      <ul className="quest-list">
        {sheet.quests.map((quest) => {
          const open = openQuestId === quest.repo.id;

          return (
            <li key={quest.repo.id}>
              <ContextMenuButton
                type="button"
                className={`quest-name difficulty-${quest.difficulty.toLowerCase()}`}
                aria-label={`${quest.title}, repository ${quest.repo.name}, ${quest.difficulty} quest`}
                data-journal-open={open || undefined}
                items={[
                  {
                    id: "open",
                    label: open ? "Close quest" : "Open quest",
                    target: quest.title,
                    onSelect: () => toggleQuest(quest),
                  },
                  {
                    id: "examine",
                    label: "Examine",
                    target: quest.title,
                    onSelect: () =>
                      say(
                        "examine",
                        `${quest.title}: the journal alias for ${quest.repo.full_name}. ${quest.description}`,
                      ),
                  },
                  {
                    id: "repository",
                    label: "Visit repository",
                    target: quest.repo.name,
                    onSelect: () =>
                      window.open(quest.repo.html_url, "_blank", "noreferrer"),
                  },
                ]}
              >
                <span>{quest.title}</span>
                <small>{quest.repo.name}</small>
              </ContextMenuButton>

              {open ? (
                <div className="quest-journal-page">
                  <h4>{quest.title}</h4>
                  <p className="journal-repo">
                    Repository: <strong>{quest.repo.full_name}</strong>
                  </p>
                  <p className="journal-flavor">{quest.description}</p>
                  <ul className="journal-facts">
                    <li>
                      Difficulty: <strong>{quest.difficulty}</strong>
                    </li>
                    <li>
                      Tongue: <strong>{quest.language}</strong>
                    </li>
                    <li>
                      Stars earned:{" "}
                      <strong>
                        {quest.repo.stargazers_count.toLocaleString()}
                      </strong>
                    </li>
                    <li>
                      Forks of the path:{" "}
                      <strong>{quest.repo.forks_count.toLocaleString()}</strong>
                    </li>
                    <li>
                      Last chronicled: <strong>{quest.updatedLabel}</strong>
                    </li>
                  </ul>
                  <a
                    className="journal-link"
                    href={quest.repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open this quest on GitHub
                  </a>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="quest-footnote">
        Top {sheet.quests.length} of {sheet.metrics.totalRepos.toLocaleString()}{" "}
        public quests, ranked by stars, forks, and recency.
      </p>
    </div>
  );
}
