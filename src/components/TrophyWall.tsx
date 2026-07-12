import type { CSSProperties } from "react";
import type { WallDisplay, WallZone } from "../lib/trophyRoom";
import { SKILL_COLORS } from "./icons";

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
        <section aria-label={zone.label} key={zone.id}>
          <ul>
            {displays.filter((display) => display.zone === zone.id).map((display) => (
              <li className="wall-display-item" key={display.id}>
                <button
                  type="button"
                  className={`wall-display ${display.kind} ${display.material?.toLowerCase() ?? "skillcape"}`}
                  aria-label={`${display.name}. ${display.evidence}. ${display.description}`}
                  data-display-id={display.id}
                  data-equipped={display.equipped || undefined}
                  style={display.skill
                    ? { "--display-color": SKILL_COLORS[display.skill] } as CSSProperties
                    : undefined}
                >
                  <span className="wall-display-art" aria-hidden="true" />
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
