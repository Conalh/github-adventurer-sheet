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

    expect(markup).toContain('class="inn-back-wall"');
    expect(markup).toContain('class="inn-hearth"');
    expect(markup).toContain('class="inn-floor"');
    expect(markup).toContain('class="trophy-wall"');
    expect(markup).not.toContain('class="scene-hills"');
    expect(markup).not.toContain('class="scene-tree');
  });

  it("uses inn-appropriate copy for the walk action", () => {
    const source = readFileSync(new URL("./Viewport.tsx", import.meta.url), "utf8");

    expect(source).toContain("You cross to the other side of the inn.");
    expect(source).not.toContain("meadow");
  });

  it("keeps the nameplate in front of the worn skillcape", () => {
    const styles = readFileSync(new URL("../App.css", import.meta.url), "utf8");

    expect(styles).toMatch(/\.skillcape\s*\{[^}]*z-index:\s*0/s);
    expect(styles).toMatch(/\.nameplate\s*\{[^}]*position:\s*relative[^}]*z-index:\s*5/s);
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
