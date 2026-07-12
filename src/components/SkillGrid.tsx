import type { CSSProperties } from "react";
import {
  SKILL_LORE,
  SKILL_NAMES,
  type CharacterSheet
} from "../lib/githubCharacter";
import { SKILL_ICONS } from "./icons";

export function SkillGrid({ sheet }: { sheet: CharacterSheet }) {
  return (
    <ul className="skill-grid" aria-label="Skill levels, each out of 99">
      {SKILL_NAMES.map((skill) => {
        const level = sheet.skills[skill];
        const SkillIcon = SKILL_ICONS[skill];
        const maxed = level >= 99;

        return (
          <li
            key={skill}
            className={maxed ? "skill-cell skill-maxed" : "skill-cell"}
            aria-label={`${skill} level ${level} of 99`}
          >
            <span className="skill-icon" aria-hidden="true">
              <SkillIcon />
            </span>
            <div className="skill-copy">
              <span className="skill-name">{skill}</span>
              <span className="skill-lore">{SKILL_LORE[skill]}</span>
            </div>
            <span className="skill-level">
              <strong>{level}</strong>
              <span aria-hidden="true">/99</span>
            </span>
            <span
              className="skill-meter"
              aria-hidden="true"
              style={{ "--skill-level": `${level}%` } as CSSProperties}
            >
              <span />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
