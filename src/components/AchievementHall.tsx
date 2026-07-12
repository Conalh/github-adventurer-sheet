import type { CSSProperties, ReactNode, SVGProps } from "react";
import {
  getAchievements,
  type Achievement,
  type CharacterSheet
} from "../lib/githubCharacter";
import {
  AnvilIcon,
  CompassIcon,
  CrownIcon,
  FlameIcon,
  ForkIcon,
  HeartIcon,
  HomeIcon,
  LockIcon,
  QuillIcon,
  ScrollIcon,
  ShieldIcon,
  SparkleIcon,
  StarIcon
} from "./icons";

type IconComponent = (props: SVGProps<SVGSVGElement>) => ReactNode;

const ACHIEVEMENT_ICONS: Record<string, IconComponent> = {
  "first-forge": AnvilIcon,
  "prolific-author": QuillIcon,
  starfall: StarIcon,
  supernova: StarIcon,
  polyglot: SparkleIcon,
  "archmage-of-tongues": SparkleIcon,
  "fork-lord": ForkIcon,
  beloved: HeartIcon,
  veteran: ShieldIcon,
  elder: CrownIcon,
  lorekeeper: ScrollIcon,
  cartographer: CompassIcon,
  homesteader: HomeIcon,
  "keeper-of-the-flame": FlameIcon
};

export function AchievementHall({ sheet }: { sheet: CharacterSheet }) {
  const achievements = getAchievements(sheet.user, sheet.metrics);
  const earnedCount = achievements.filter((entry) => entry.earned).length;

  return (
    <>
      <p className="achievement-tally">
        <strong>{earnedCount}</strong> of {achievements.length} deeds earned
      </p>
      <ul className="achievement-grid">
        {achievements.map((achievement) => (
          <AchievementMedallion
            key={achievement.id}
            achievement={achievement}
          />
        ))}
      </ul>
    </>
  );
}

function AchievementMedallion({ achievement }: { achievement: Achievement }) {
  const EmblemIcon = ACHIEVEMENT_ICONS[achievement.id] ?? StarIcon;
  const progress = Math.min(1, achievement.current / achievement.goal);

  return (
    <li
      className={
        achievement.earned
          ? "achievement earned"
          : "achievement locked"
      }
      aria-label={
        achievement.earned
          ? `${achievement.name}, earned. ${achievement.requirement}.`
          : `${achievement.name}, not yet earned. ${achievement.requirement}. Progress ${achievement.current} of ${achievement.goal}.`
      }
    >
      <div className="medallion" aria-hidden="true">
        <span className="medallion-ring" />
        <span className="medallion-emblem">
          <EmblemIcon />
        </span>
        {!achievement.earned ? (
          <span className="medallion-lock">
            <LockIcon />
          </span>
        ) : null}
      </div>
      <h3>{achievement.name}</h3>
      <p className="achievement-requirement">{achievement.requirement}</p>
      {achievement.earned ? (
        <p className="achievement-flavor">{achievement.flavor}</p>
      ) : (
        <div className="achievement-progress">
          <span
            className="achievement-bar"
            style={{ "--progress": `${(progress * 100).toFixed(1)}%` } as CSSProperties}
          >
            <span />
          </span>
          <span className="achievement-count">
            {achievement.current.toLocaleString()} / {achievement.goal.toLocaleString()}
          </span>
        </div>
      )}
    </li>
  );
}
