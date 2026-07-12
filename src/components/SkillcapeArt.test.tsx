import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SKILL_NAMES } from "../lib/githubCharacter";
import { SkillcapeArt, getSkillcapePalette } from "./SkillcapeArt";

describe("SkillcapeArt", () => {
  it("renders garment geometry and a distinct emblem for every supported skill", () => {
    const markup = SKILL_NAMES.map((skill) =>
      renderToStaticMarkup(
        <SkillcapeArt skill={skill} trimmed={false} variant="wall" />,
      ),
    );

    expect(new Set(SKILL_NAMES.map((skill) => getSkillcapePalette(skill).body)).size)
      .toBe(SKILL_NAMES.length);
    for (const [index, skill] of SKILL_NAMES.entries()) {
      expect(markup[index]).toContain(`data-skill="${skill}"`);
      expect(markup[index]).toContain('class="skillcape-art__garment"');
      expect(markup[index]).toContain('class="skillcape-art__emblem"');
    }
  });

  it("marks trimmed capes and falls back safely for unknown skills", () => {
    const trimmed = renderToStaticMarkup(
      <SkillcapeArt skill="Strength" trimmed variant="worn" />,
    );
    const unknown = renderToStaticMarkup(
      <SkillcapeArt skill="Unknown" trimmed={false} variant="wall" />,
    );

    expect(trimmed).toContain('data-trimmed="true"');
    expect(trimmed).toContain('skillcape-art--worn');
    expect(unknown).toContain('data-skill="Unknown"');
    expect(getSkillcapePalette("Unknown").body).toBe("#6f6759");
  });
});
