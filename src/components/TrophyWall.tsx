import type { WallDisplay, WallZone } from "../lib/trophyRoom";
import { SkillcapeArt } from "./SkillcapeArt";
import { TrophyArt } from "./TrophyArt";

type TrophyWallProps = {
  displays: WallDisplay[];
};

const WALL_ZONES: { id: WallZone; label: string }[] = [
  { id: "cape-hooks", label: "Cape hooks" },
  { id: "upper-wall", label: "Upper wall" },
  { id: "trophy-shelf", label: "Trophy shelf" },
];

export function TrophyWall({ displays }: TrophyWallProps) {
  return (
    <div className="trophy-wall">
      {WALL_ZONES.map((zone) => (
        <section aria-label={zone.label} className={`wall-zone ${zone.id}`} key={zone.id}>
          <ul className="wall-display-list">
            {displays.filter((display) => display.zone === zone.id).map((display) => (
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
        </section>
      ))}
    </div>
  );
}
