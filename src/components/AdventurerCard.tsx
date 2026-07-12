import { useRef, type MouseEvent } from "react";
import type { CharacterSheet, SkillName } from "../lib/githubCharacter";

const CARD_STATS: Array<[SkillName, string]> = [
  ["Attack", "ATK"],
  ["Strength", "STR"],
  ["Defence", "DEF"],
  ["Ranged", "RNG"],
  ["Magic", "MAG"],
  ["Crafting", "CRF"]
];

const MAX_TILT_DEGREES = 5;

export function AdventurerCard({
  sheet,
  isDemo
}: {
  sheet: CharacterSheet;
  isDemo: boolean;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const displayName = sheet.user.name || sheet.user.login;

  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    const card = cardRef.current;

    if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const bounds = card.getBoundingClientRect();
    const ratioX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const ratioY = (event.clientY - bounds.top) / bounds.height - 0.5;

    card.style.setProperty(
      "--tilt-x",
      `${(-ratioY * MAX_TILT_DEGREES).toFixed(2)}deg`
    );
    card.style.setProperty(
      "--tilt-y",
      `${(ratioX * MAX_TILT_DEGREES).toFixed(2)}deg`
    );
    card.style.setProperty("--sheen-x", `${((ratioX + 0.5) * 100).toFixed(1)}%`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;

    if (!card) {
      return;
    }

    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <div className="card-perspective">
      <section
        ref={cardRef}
        className="adventurer-card"
        aria-labelledby="character-name"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="card-frame" aria-hidden="true" />
        <div className="card-sheen" aria-hidden="true" />

        <div className="card-topline">
          <div className="card-badge" title="Combat level">
            <strong>{sheet.combatLevel}</strong>
            <span>Combat</span>
          </div>
          <div className="card-crest" aria-hidden="true">
            ❖
          </div>
          <div className="card-badge" title="Total level">
            <strong>{sheet.totalLevel}</strong>
            <span>Total</span>
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
          {isDemo ? <p className="card-kicker">Default demo hero</p> : null}
          <h2 id="character-name">{displayName}</h2>
          <p className="class-title">{sheet.characterClass}</p>
          <a href={sheet.user.html_url} target="_blank" rel="noreferrer">
            @{sheet.user.login}
          </a>
        </div>

        <dl className="card-stat-grid" aria-label="Primary GitHub character stats">
          {CARD_STATS.map(([skill, label]) => (
            <div key={skill}>
              <dt>{label}</dt>
              <dd>{sheet.skills[skill]}</dd>
            </div>
          ))}
        </dl>

        <p className="card-footer">✦ GitHub Quest Card ✦</p>
      </section>
    </div>
  );
}
