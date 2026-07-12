// @ts-expect-error The app intentionally omits Node typings; Vitest supplies this at runtime.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function mediaBlock(styles: string, query: string): string {
  const start = styles.indexOf(`@media ${query}`);
  if (start < 0) return "";
  const open = styles.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < styles.length; index += 1) {
    if (styles[index] === "{") depth += 1;
    if (styles[index] === "}") depth -= 1;
    if (depth === 0) return styles.slice(open + 1, index);
  }
  return "";
}

describe("GameClient desktop frame", () => {
  it("contains tall tabs inside a stable desktop scene", () => {
    const styles = readFileSync(new URL("../App.css", import.meta.url), "utf8");
    const desktop = mediaBlock(styles, "(min-width: 941px)");

    expect(desktop).toMatch(/\.client-body\s*\{[^}]*height:\s*520px/s);
    expect(desktop).toMatch(/\.viewport\s*\{[^}]*height:\s*100%[^}]*min-height:\s*0/s);
    expect(desktop).toMatch(/\.sidebar\s*\{[^}]*height:\s*100%[^}]*min-height:\s*0/s);
    expect(desktop).toMatch(/\.tab-panel\s*\{[^}]*min-height:\s*0[^}]*overflow-x:\s*hidden[^}]*overflow-y:\s*auto/s);
  });

  it("keeps the fixed frame out of the stacked fallback", () => {
    const styles = readFileSync(new URL("../App.css", import.meta.url), "utf8");
    const mobile = mediaBlock(styles, "(max-width: 940px)");

    expect(mobile).toMatch(/\.client-body\s*\{[^}]*grid-template-columns:\s*1fr/s);
    expect(mobile).not.toMatch(/\.client-body\s*\{[^}]*height:\s*520px/s);
    expect(mobile).toMatch(/\.tab-panel\s*\{[^}]*min-height:\s*0/s);
  });
});
