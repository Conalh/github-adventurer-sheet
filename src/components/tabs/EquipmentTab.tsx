import type { ReactNode, SVGProps } from "react";
import type {
  CharacterSheet,
  EquipmentItem,
  EquipmentSlot
} from "../../lib/githubCharacter";
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

const FILLED_SLOT_ICONS: Record<EquipmentSlot, IconComponent> = {
  "Main hand": SwordIcon,
  "Off hand": ShieldIcon,
  Cape: CapeIcon,
  Amulet: AmuletIcon,
  Ring: RingIcon
};

const EMPTY_SLOTS: Array<{
  id: string;
  label: string;
  icon: IconComponent;
  area: string;
}> = [
  { id: "head", label: "Head slot (empty)", icon: HelmetIcon, area: "head" },
  { id: "ammo", label: "Ammo slot (empty)", icon: ArrowsIcon, area: "ammo" },
  { id: "body", label: "Body slot (empty)", icon: TorsoIcon, area: "body" },
  { id: "legs", label: "Legs slot (empty)", icon: LegsIcon, area: "legs" },
  { id: "hands", label: "Hands slot (empty)", icon: GlovesIcon, area: "hands" },
  { id: "feet", label: "Feet slot (empty)", icon: BootsIcon, area: "feet" }
];

const SLOT_AREAS: Record<EquipmentSlot, string> = {
  Cape: "cape",
  Amulet: "neck",
  "Main hand": "weapon",
  "Off hand": "shield",
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
          const SlotIcon = FILLED_SLOT_ICONS[item.slot];
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

        {EMPTY_SLOTS.map((slot) => {
          const SlotIcon = slot.icon;

          return (
            <span
              key={slot.id}
              className="worn-slot empty"
              style={{ gridArea: slot.area }}
              aria-label={slot.label}
            >
              <SlotIcon />
            </span>
          );
        })}
      </div>

      <h3 className="rs-subheading">Backpack</h3>
      <ul className="inventory-grid" aria-label="Backpack supplies">
        {sheet.equipment.backpack.map((item) => (
          <li key={item}>
            <button
              type="button"
              className="inventory-item"
              onClick={() =>
                say("examine", `It's a satchel of ${item}. Trusty supplies.`)
              }
              aria-label={item}
            >
              <span aria-hidden="true">{abbreviate(item)}</span>
              <span className="rs-tooltip" role="presentation">
                <strong>{item}</strong>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function abbreviate(value: string): string {
  const clean = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9+#]/g, " ")
    .trim();
  const words = clean.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0]![0] ?? ""}${words[1]![0] ?? ""}`.toUpperCase();
  }

  return clean.slice(0, 2).toUpperCase();
}
