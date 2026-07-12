import type { WallDisplay, WallZone } from "../lib/trophyRoom";
import { SkillcapeArt } from "./SkillcapeArt";
import { TrophyArt } from "./TrophyArt";

type TrophyWallProps = {
  displays: WallDisplay[];
};

const WALL_ZONES: { id: WallZone; label: string }[] = [
  { id: "upper-wall", label: "Upper wall" },
  { id: "trophy-shelf", label: "Trophy shelf" },
];

export function TrophyWall({ displays }: TrophyWallProps) {
  const capes = displays.filter((display) => display.zone === "cape-hooks");
  const leftCapeCount = Math.ceil(capes.length / 2);
  const leftCapes = capes.slice(0, leftCapeCount);
  const rightCapes = capes.slice(leftCapeCount);

  return (
    <div className="trophy-wall">
      <section
        aria-label="Cape hooks"
        className="wall-zone cape-hooks"
        data-cape-count={capes.length}
      >
        <DisplayList displays={leftCapes} capeSide="left" />
        <DisplayList displays={rightCapes} capeSide="right" />
      </section>
      {WALL_ZONES.map((zone) => (
        <section aria-label={zone.label} className={`wall-zone ${zone.id}`} key={zone.id}>
          <DisplayList displays={displays.filter((display) => display.zone === zone.id)} />
        </section>
      ))}
    </div>
  );
}

function DisplayList({
  displays,
  capeSide,
}: {
  displays: WallDisplay[];
  capeSide?: "left" | "right";
}) {
  return (
    <ul
      className={`wall-display-list${capeSide ? ` cape-hook-group cape-hook-group--${capeSide}` : ""}`}
      data-cape-side={capeSide}
      data-display-count={capeSide ? displays.length : undefined}
    >
      {displays.map((display) => (
        <li className="wall-display-item" key={display.id}>
          <button
            type="button"
            className={`wall-display ${display.kind} ${display.material?.toLowerCase() ?? "cape-display"}`}
            aria-label={`${display.name}. ${display.evidence}. ${display.description}`}
            data-display-id={display.id}
            data-equipped={display.equipped || undefined}
          >
            {display.kind === "cape" && display.skill ? (
              <SkillcapeArt
                skill={display.skill}
                trimmed={display.trimmed}
                variant="wall"
              />
            ) : (
              <TrophyArt
                displayId={display.id}
                material={display.material ?? "Bronze"}
              />
            )}
            <span className="wall-display-tooltip" role="tooltip">
              <strong>{display.material ? `${display.material} ${display.name}` : display.name}</strong>
              <span>{display.evidence}</span>
              <span>{display.description}</span>
              {display.equipped ? <em>Currently equipped</em> : null}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
