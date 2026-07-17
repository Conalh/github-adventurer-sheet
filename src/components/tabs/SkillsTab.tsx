import {
  rsXpForLevel,
  skillXpFromScore,
  SKILL_LORE,
  SKILL_NAMES,
  type CharacterSheet,
  type SkillName
} from "../../lib/githubCharacter";
import type { ChatMessage } from "../Chatbox";
import { ContextMenuButton } from "../ContextMenuButton";
import { FloatingTooltip } from "../FloatingTooltip";
import { SKILL_ICONS } from "../icons";

export function SkillsTab({
  sheet,
  say
}: {
  sheet: CharacterSheet;
  say: (kind: ChatMessage["kind"], text: string) => void;
}) {
  const examineSkill = (skill: SkillName) => {
    const xp = skillXpFromScore(sheet.skillScores[skill]);
    const level = sheet.skills[skill];
    const nextLevel =
      level >= 99
        ? null
        : `Next level at ${rsXpForLevel(level + 1).toLocaleString()} XP.`;

    say(
      "examine",
      `${skill} XP: ${xp.toLocaleString()}. ${
        nextLevel ?? "This skill is mastered."
      } (${SKILL_LORE[skill]}.)`
    );
  };

  return (
    <div className="skills-tab">
      <ul className="rs-skill-grid" aria-label="Skill levels, each out of 99">
        {SKILL_NAMES.map((skill) => {
          const level = sheet.skills[skill];
          const xp = skillXpFromScore(sheet.skillScores[skill]);
          const SkillIcon = SKILL_ICONS[skill];

          return (
            <li key={skill}>
              <ContextMenuButton
                type="button"
                className={
                  level >= 99 ? "rs-skill-cell maxed" : "rs-skill-cell"
                }
                aria-label={`${skill} level ${level} of 99, ${xp.toLocaleString()} experience`}
                items={[
                  {
                    id: "guide",
                    label: "View guide",
                    target: skill,
                    onSelect: () =>
                      say(
                        "game",
                        `${skill} guide: ${SKILL_LORE[skill]}. Keep committing to train it.`,
                      ),
                  },
                  {
                    id: "examine",
                    label: "Examine",
                    target: skill,
                    onSelect: () => examineSkill(skill),
                  },
                ]}
              >
                <span
                  className={`rs-skill-icon skill-color-${skill.toLowerCase()}`}
                  aria-hidden="true"
                >
                  <SkillIcon />
                </span>
                <span className="rs-skill-numbers" aria-hidden="true">
                  <span className="current">{level}</span>
                  <span className="slash" />
                  <span className="target">99</span>
                </span>
                <FloatingTooltip>
                  <strong>{skill}</strong>
                  <em>{SKILL_LORE[skill]}</em>
                  <span>XP: {xp.toLocaleString()}</span>
                  {level < 99 ? (
                    <span>
                      Next level at: {rsXpForLevel(level + 1).toLocaleString()}
                    </span>
                  ) : (
                    <span>Skill mastered!</span>
                  )}
                </FloatingTooltip>
              </ContextMenuButton>
            </li>
          );
        })}
      </ul>

      <p
        className={
          sheet.totalLevel >= 600 ? "rs-total-cell golden" : "rs-total-cell"
        }
      >
        Total level:
        <strong>{sheet.totalLevel}</strong>
      </p>
    </div>
  );
}
