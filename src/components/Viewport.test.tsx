// @ts-expect-error The app intentionally omits Node typings; Vitest supplies this at runtime.
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CharacterSheet } from "../lib/githubCharacter";
import { Viewport } from "./Viewport";

const skills = {
  Attack: 1, Strength: 99, Defence: 1, Ranged: 1, Magic: 1,
  Crafting: 1, Mining: 1, Smithing: 1, Prayer: 1, Hitpoints: 10,
};

const fixture = {
  user: {
    login: "adventurer", name: "Adventurer", avatar_url: null, bio: null,
    html_url: "https://github.com/adventurer",
  },
  skills,
  skillScores: { ...skills, Strength: 100_000 },
  prestige: {
    tier: 2, title: "Master", ninetyNines: ["Strength"],
    capeSkill: "Strength", trimmed: false,
  },
  trophyRoom: { displays: [] },
  characterClass: "Code Warrior",
  combatLevel: 42,
  totalLevel: 118,
} as unknown as CharacterSheet;

describe("Viewport", () => {
  it("renders the guild inn without outdoor scene layers", () => {
    const markup = renderToStaticMarkup(
      <Viewport sheet={fixture} say={() => undefined} />,
    );

    expect(markup).toContain('class="inn-room"');
    expect(markup).toContain('class="inn-central-rug"');
    expect(markup).toContain('class="inn-counter"');
    expect(markup).toContain('class="trophy-wall"');
    expect(markup).not.toContain('class="inn-back-wall"');
    expect(markup).not.toContain('class="inn-stonework"');
    expect(markup).not.toContain('class="inn-banner');
    expect(markup).not.toContain('class="scene-hills"');
    expect(markup).not.toContain('class="scene-tree');
  });

  it("uses inn-appropriate copy for the walk action", () => {
    const source = readFileSync(new URL("./Viewport.tsx", import.meta.url), "utf8");

    expect(source).toContain("You cross to the other side of the inn.");
    expect(source).not.toContain("meadow");
  });

  it("uses the illustrated garment for the equipped cape", () => {
    const markup = renderToStaticMarkup(
      <Viewport sheet={fixture} say={() => undefined} />,
    );

    expect(markup).toContain("skillcape-art--worn");
    expect(markup).toContain('data-skill="Strength"');
    expect(markup.match(/skillcape-art__garment/g)).toHaveLength(1);
  });

  it("keeps the nameplate in front of the worn skillcape", () => {
    const styles = readFileSync(new URL("../App.css", import.meta.url), "utf8");

    expect(styles).toMatch(/\.skillcape\s*\{[^}]*z-index:\s*4/s);
    expect(styles).toMatch(/\.nameplate\s*\{[^}]*position:\s*relative[^}]*z-index:\s*6/s);
  });

  it("defines the top-down room and foreground stacking contract", () => {
    const styles = readFileSync(new URL("../App.css", import.meta.url), "utf8");

    expect(styles).toMatch(/\.inn-room\s*\{[^}]*pointer-events:\s*none/s);
    expect(styles).toMatch(/\.inn-floorboards\s*\{[^}]*repeating-linear-gradient/s);
    expect(styles).toMatch(/\.inn-central-rug\s*\{[^}]*z-index:\s*1/s);
    expect(styles).toMatch(/\.skillcape\s*\{[^}]*z-index:\s*4/s);
    expect(styles).toMatch(/\.player-avatar\s*\{[^}]*z-index:\s*5/s);
    expect(styles).toMatch(/\.nameplate\s*\{[^}]*z-index:\s*6/s);
    expect(styles).not.toContain(".inn-back-wall");
    expect(styles).not.toContain(".wall-display.cape .wall-display-art");
  });

  it("does not let empty player-layer space block wall display pointers", () => {
    const styles = readFileSync(new URL("../App.css", import.meta.url), "utf8");

    expect(styles).toMatch(/\.player\s*\{[^}]*pointer-events:\s*none/s);
    expect(styles).toMatch(/\.player-hitbox\s*\{[^}]*pointer-events:\s*auto/s);
    expect(styles).toMatch(/\.context-menu\s*\{[^}]*pointer-events:\s*auto/s);
    expect(styles).toMatch(/\.nameplate a\s*\{[^}]*pointer-events:\s*auto/s);
    expect(styles).toMatch(/\.inn-hearth\s*\{[^}]*pointer-events:\s*none/s);
  });

  it("removes obsolete outdoor-only scene styles", () => {
    const styles = readFileSync(new URL("../App.css", import.meta.url), "utf8");

    for (const selector of [
      ".scene-sky",
      ".campfire",
      ".minimap",
      ".firework",
      ".pet-phoenix",
      "@keyframes star-twinkle",
      "@keyframes glow-pulse",
      "@keyframes flame-flicker",
    ]) {
      expect(styles).not.toContain(selector);
    }
  });
});
