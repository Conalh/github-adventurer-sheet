import { getAchievements, type CharacterSheet } from "../../lib/githubCharacter";
import type { ChatMessage } from "../Chatbox";
import { FloatingTooltip } from "../FloatingTooltip";

export function DeedsTab({
  sheet,
  say
}: {
  sheet: CharacterSheet;
  say: (kind: ChatMessage["kind"], text: string) => void;
}) {
  const achievements = getAchievements(sheet.user, sheet.metrics);
  const earnedCount = achievements.filter((entry) => entry.earned).length;

  return (
    <div className="deeds-tab">
      <header className="rs-tab-heading">
        <h3>Deed Diary</h3>
        <span className="quest-points">
          {earnedCount}/{achievements.length}
        </span>
      </header>

      <ul className="deed-list">
        {achievements.map((achievement) => (
          <li key={achievement.id}>
            <button
              type="button"
              className={achievement.earned ? "deed-row done" : "deed-row"}
              onClick={() =>
                say(
                  "examine",
                  achievement.earned
                    ? `${achievement.name} — complete. ${achievement.flavor}`
                    : `${achievement.name} — ${achievement.requirement}. Progress: ${achievement.current.toLocaleString()}/${achievement.goal.toLocaleString()}.`
                )
              }
            >
              <span className="deed-name">{achievement.name}</span>
              <span className="deed-progress">
                {achievement.earned
                  ? "✓"
                  : `${achievement.current.toLocaleString()}/${achievement.goal.toLocaleString()}`}
              </span>
              <FloatingTooltip>
                <strong>{achievement.name}</strong>
                <em>{achievement.requirement}</em>
                <span>
                  {achievement.earned
                    ? achievement.flavor
                    : `Progress: ${achievement.current.toLocaleString()} / ${achievement.goal.toLocaleString()}`}
                </span>
              </FloatingTooltip>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
