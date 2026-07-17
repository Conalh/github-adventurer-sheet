import type { ReactNode, SVGProps } from "react";
import type { CharacterSheet } from "../../lib/githubCharacter";
import {
  formatStackCount,
  type EquipmentItem,
  type EquipmentSlot
} from "../../lib/equipment";
import type { ChatMessage } from "../Chatbox";
import { ContextMenuButton } from "../ContextMenuButton";
import { FloatingTooltip } from "../FloatingTooltip";
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

          return (
            <ContextMenuButton
              key={item.slot}
              type="button"
              className={`worn-slot filled${item.isFallback ? " fallback" : ""} rarity-${item.rarity.toLowerCase()}`}
              style={{ gridArea: SLOT_AREAS[item.slot] }}
              aria-label={`${item.slot}: ${item.name}, ${item.rarity}. ${item.detail}`}
              items={[
                {
                  id: "remove",
                  label: "Remove",
                  target: item.name,
                  onSelect: () =>
                    say(
                      "game",
                      `You remove ${item.name} for one tick, then wisely put it back.`,
                    ),
                },
                {
                  id: "examine",
                  label: "Examine",
                  target: item.name,
                  onSelect: () => examine(item),
                },
              ]}
            >
              <SlotIcon />
              <FloatingTooltip>
                <strong className={`rarity-${item.rarity.toLowerCase()}`}>
                  {item.name}
                </strong>
                <em>
                  {item.slot} · {item.rarity}
                </em>
                <span>{item.detail}</span>
              </FloatingTooltip>
            </ContextMenuButton>
          );
        })}

      </div>

      <h3 className="rs-subheading">Backpack</h3>
      <ul className="inventory-grid" aria-label="Backpack supplies">
        {sheet.equipment.backpack.map((item) => (
          <li key={item.id}>
            <ContextMenuButton
              type="button"
              className="inventory-item"
              aria-label={`${item.name}, ${item.count.toLocaleString("en")} — ${item.examine}`}
              items={[
                {
                  id: "use",
                  label: "Use",
                  target: item.name,
                  onSelect: () =>
                    say(
                      "game",
                      `You use ${item.name}. The repository economy remains unchanged.`,
                    ),
                },
                {
                  id: "examine",
                  label: "Examine",
                  target: item.name,
                  onSelect: () =>
                    say(
                      "examine",
                      `${item.name} (${item.count.toLocaleString("en")}): ${item.examine}`,
                    ),
                },
              ]}
            >
              <span className={`inventory-glyph kind-${item.kind}`} aria-hidden="true">
                {item.abbreviation}
              </span>
              <span className="inventory-count" aria-hidden="true">
                {formatStackCount(item.count)}
              </span>
              <FloatingTooltip>
                <strong>{item.name}</strong>
              </FloatingTooltip>
            </ContextMenuButton>
          </li>
        ))}
      </ul>
    </div>
  );
}
