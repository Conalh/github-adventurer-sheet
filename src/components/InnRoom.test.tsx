import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InnRoom } from "./InnRoom";

describe("InnRoom", () => {
  it("renders one inert top-down room with the required composition anchors", () => {
    const markup = renderToStaticMarkup(<InnRoom />);

    expect(markup).toContain('class="inn-room"');
    expect(markup).toContain('aria-hidden="true"');
    for (const className of [
      "inn-floorboards",
      "inn-central-rug",
      "inn-wall inn-wall--north",
      "inn-wall inn-wall--west",
      "inn-wall inn-wall--east",
      "inn-table inn-table--left",
      "inn-table inn-table--right",
      "inn-counter",
      "inn-hearth",
    ]) {
      expect(markup).toContain(`class="${className}"`);
    }
  });
});
