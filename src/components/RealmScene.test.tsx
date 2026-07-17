// @ts-expect-error The app intentionally omits Node typings; Vitest supplies this at runtime.
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RealmScene } from "./RealmScene";

describe("RealmScene", () => {
  it("keeps Adepts in the timber guild inn", () => {
    const markup = renderToStaticMarkup(<RealmScene tier={1} />);

    expect(markup).toContain("inn-room--guild");
    expect(markup).toContain('data-realm-tier="1"');
    expect(markup).not.toContain("legend-hall");
  });

  it("upgrades Masters with standards while retaining the hearth", () => {
    const markup = renderToStaticMarkup(<RealmScene tier={2} />);

    expect(markup).toContain("inn-room--heroes");
    expect(markup.match(/heroes-standard/g)).toHaveLength(4);
    expect(markup).toContain("inn-hearth");
  });

  it("routes Grandmasters into a separate monumental scene", () => {
    const markup = renderToStaticMarkup(<RealmScene tier={3} />);

    expect(markup).toContain('class="legend-hall"');
    expect(markup).toContain("legend-architecture");
    expect(markup).toContain("legend-outer-arch");
    expect(markup).toContain("legend-sigil");
    expect(markup).not.toContain("inn-room");
    expect(markup).not.toContain("inn-table");
  });

  it("gives each high-tier realm a distinct visual contract", () => {
    const styles = readFileSync(new URL("../App.css", import.meta.url), "utf8");

    expect(styles).toMatch(/\.inn-room--heroes\s*\{[^}]*--wood:/s);
    expect(styles).toMatch(/\.legend-hall\s*\{[^}]*radial-gradient/s);
    expect(styles).toMatch(
      /\.realm-legend \.trophy-wall\s*\{(?=[^}]*inset:\s*82px 28px 72px)(?![^}]*z-index:)[^}]*\}/s,
    );
    expect(styles).toMatch(/\.realm-legend \.player-avatar\s*\{[^}]*border-color:\s*#e1bd58/s);
  });
});
