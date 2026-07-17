import type { WallDisplay, WallZone } from "../lib/trophyRoom";
import type { ChatMessage } from "./Chatbox";
import { ContextMenuButton } from "./ContextMenuButton";
import { SkillcapeArt } from "./SkillcapeArt";
import { TrophyArt } from "./TrophyArt";

type TrophyWallProps = {
  displays: WallDisplay[];
  say?: (kind: ChatMessage["kind"], text: string) => void;
};

const WALL_ZONES: { id: WallZone; label: string }[] = [
  { id: "upper-wall", label: "Upper wall" },
  { id: "trophy-shelf", label: "Trophy shelf" },
];

export function TrophyWall({ displays, say }: TrophyWallProps) {
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
        <DisplayList displays={leftCapes} capeSide="left" say={say} />
        <DisplayList displays={rightCapes} capeSide="right" say={say} />
      </section>
      {WALL_ZONES.map((zone) => (
        <section aria-label={zone.label} className={`wall-zone ${zone.id}`} key={zone.id}>
          <DisplayList
            displays={displays.filter((display) => display.zone === zone.id)}
            say={say}
          />
        </section>
      ))}
    </div>
  );
}

function DisplayList({
  displays,
  capeSide,
  say,
}: {
  displays: WallDisplay[];
  capeSide?: "left" | "right";
  say?: (kind: ChatMessage["kind"], text: string) => void;
}) {
  return (
    <ul
      className={`wall-display-list${capeSide ? ` cape-hook-group cape-hook-group--${capeSide}` : ""}`}
      data-cape-side={capeSide}
      data-display-count={capeSide ? displays.length : undefined}
    >
      {displays.map((display) => (
        <li className="wall-display-item" key={display.id}>
          <ContextMenuButton
            type="button"
            className={`wall-display ${display.kind} ${display.material?.toLowerCase() ?? "cape-display"}`}
            aria-label={`${display.name}. ${display.evidence}. ${display.description}`}
            data-display-id={display.id}
            data-equipped={display.equipped || undefined}
            items={[
              {
                id: "examine",
                label: "Examine",
                target: display.name,
                onSelect: () =>
                  say?.(
                    "examine",
                    `${display.name}: ${display.evidence} ${display.description}`,
                  ),
              },
              {
                id: "admire",
                label: display.equipped ? "Admire worn" : "Admire",
                target: display.name,
                onSelect: () =>
                  say?.(
                    "game",
                    display.equipped
                      ? `You admire the ${display.name}. It looks even better equipped.`
                      : `You admire the ${display.name}. Nothing interesting happens, but it gleams approvingly.`,
                  ),
              },
            ]}
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
          </ContextMenuButton>
        </li>
      ))}
    </ul>
  );
}
