// @ts-expect-error Tests run in Node, but this browser project intentionally omits @types/node.
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CharacterSheet } from "../../lib/githubCharacter";
import {
  EQUIPMENT_SLOT_ORDER,
  type CharacterEquipment
} from "../../lib/equipment";
import { EquipmentTab } from "./EquipmentTab";

describe("EquipmentTab", () => {
  it("renders every worn slot with fallback and stack information", () => {
    const items = EQUIPMENT_SLOT_ORDER.map((slot) => ({
      slot,
      name: slot === "Head" ? "Unadorned Hood" : `${slot} item`,
      detail: slot === "Head" ? "No field of study declared" : "Derived detail",
      rarity: "Common" as const,
      isFallback: slot === "Head"
    }));

    const equipment: CharacterEquipment = {
      items,
      backpack: [{
        id: "currency:gold",
        kind: "currency",
        name: "Gold pouch",
        abbreviation: "GP",
        count: 15_794,
        examine: "Reputation minted from followers and stars"
      }]
    };

    const markup = renderToStaticMarkup(
      <EquipmentTab
        sheet={{ equipment } as CharacterSheet}
        say={() => undefined}
      />
    );

    expect(markup.match(/class="worn-slot/g)).toHaveLength(11);
    expect(markup).toContain("fallback rarity-common");
    expect(markup).toContain('aria-label="Head: Unadorned Hood, Common.');
    expect(markup).toContain('class="inventory-count"');
    expect(markup).toContain(">15.8K<");
    expect(markup).toContain("Gold pouch");
  });

  it("excludes fallback slots from rarity glow selectors", () => {
    const styles = readFileSync(new URL("../../App.css", import.meta.url), "utf8");

    expect(styles).toContain(
      ".worn-slot.filled:not(.fallback).rarity-epic svg"
    );
    expect(styles).toContain(
      ".worn-slot.filled:not(.fallback).rarity-legendary svg"
    );
  });
});
