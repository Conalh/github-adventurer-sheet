import type { ReactNode, SVGProps } from "react";
import type { CharacterSheet } from "../../lib/githubCharacter";
import type { EquipmentItem, EquipmentSlot } from "../../lib/equipment";
import type { ChatMessage } from "../Chatbox";
import {
  AmuletIcon,
  ArrowsIcon,
  BootsIcon,
  CapeIcon,
  GlovesIcon,
  HelmetIcon,
  LegsIcon,
  RingIcon,
  ShieldIcon,
  SwordIcon,
  TorsoIcon
} from "../icons";

type IconComponent = (props: SVGProps<SVGSVGElement>) => ReactNode;

const SLOT_ICONS: Record<EquipmentSlot, IconComponent> = {
  Head: HelmetIcon,
  "Main hand": SwordIcon,
  "Off hand": ShieldIcon,
  Cape: CapeIcon,
  Amulet: AmuletIcon,
  Ring: RingIcon,
  Ammo: ArrowsIcon,
  Body: TorsoIcon,
  Legs: LegsIcon,
  Hands: GlovesIcon,
  Feet: BootsIcon
};

const SLOT_AREAS: Record<EquipmentSlot, string> = {
  Head: "head",
  Cape: "cape",
  Amulet: "neck",
  Ammo: "ammo",
  "Main hand": "weapon",
  Body: "body",
  "Off hand": "shield",
  Legs: "legs",
  Hands: "hands",
  Feet: "feet",
  Ring: "ring"
};

export function EquipmentTab({
  sheet,
  say
}: {
  sheet: CharacterSheet;
  say: (kind: ChatMessage["kind"], text: string) => void;
}) {
  const examine = (item: EquipmentItem) => {
    say(
      "examine",
      `${item.name} (${item.rarity.toLowerCase()}): ${item.detail}.`
    );
  };

  return (
    <div className="equipment-tab">
      <div className="worn-grid" aria-label="Worn equipment">
        {sheet.equipment.items.map((item) => {
          const SlotIcon = SLOT_ICONS[item.slot];
          const edgeClass =
            item.slot === "Off hand" || item.slot === "Ring" ? " tip-end" : "";

          return (
            <button
              key={item.slot}
              type="button"
              className={`worn-slot filled rarity-${item.rarity.toLowerCase()}${edgeClass}`}
              style={{ gridArea: SLOT_AREAS[item.slot] }}
              onClick={() => examine(item)}
              aria-label={`${item.slot}: ${item.name}, ${item.rarity}. ${item.detail}`}
            >
              <SlotIcon />
              <span className="rs-tooltip" role="presentation">
                <strong className={`rarity-${item.rarity.toLowerCase()}`}>
                  {item.name}
                </strong>
                <em>
                  {item.slot} · {item.rarity}
                </em>
                <span>{item.detail}</span>
              </span>
            </button>
          );
        })}

      </div>

      <h3 className="rs-subheading">Backpack</h3>
      <ul className="inventory-grid" aria-label="Backpack supplies">
        {sheet.equipment.backpack.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="inventory-item"
              onClick={() => say("examine", item.examine)}
              aria-label={item.name}
            >
              <span aria-hidden="true">{item.abbreviation}</span>
              <span className="rs-tooltip" role="presentation">
                <strong>{item.name}</strong>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
