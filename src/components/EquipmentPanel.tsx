import type { ReactNode, SVGProps } from "react";
import type { CharacterSheet, EquipmentSlot } from "../lib/githubCharacter";
import {
  AmuletIcon,
  BackpackIcon,
  CapeIcon,
  RingIcon,
  ShieldIcon,
  SwordIcon
} from "./icons";
import { RarityTag } from "./ui";

const SLOT_ICONS: Record<
  EquipmentSlot,
  (props: SVGProps<SVGSVGElement>) => ReactNode
> = {
  "Main hand": SwordIcon,
  "Off hand": ShieldIcon,
  Cape: CapeIcon,
  Amulet: AmuletIcon,
  Ring: RingIcon
};

export function EquipmentPanel({ sheet }: { sheet: CharacterSheet }) {
  return (
    <>
      <ul className="equipment-list">
        {sheet.equipment.items.map((item) => {
          const SlotIcon = SLOT_ICONS[item.slot];

          return (
            <li
              key={item.slot}
              className={`equipment-item rarity-border-${item.rarity.toLowerCase()}`}
            >
              <span
                className={`equipment-icon rarity-text-${item.rarity.toLowerCase()}`}
                aria-hidden="true"
              >
                <SlotIcon />
              </span>
              <div className="equipment-copy">
                <span className="equipment-slot">{item.slot}</span>
                <span
                  className={`equipment-name rarity-text-${item.rarity.toLowerCase()}`}
                >
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noreferrer">
                      {item.name}
                    </a>
                  ) : (
                    item.name
                  )}
                </span>
                <span className="equipment-detail">{item.detail}</span>
              </div>
              <RarityTag rarity={item.rarity} />
            </li>
          );
        })}
      </ul>

      <div className="backpack">
        <h3>
          <span className="heading-icon" aria-hidden="true">
            <BackpackIcon />
          </span>
          Backpack
        </h3>
        <ul>
          {sheet.equipment.backpack.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
