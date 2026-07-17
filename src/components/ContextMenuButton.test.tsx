import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ContextMenuButton,
  fitContextMenuToViewport,
} from "./ContextMenuButton";

describe("ContextMenuButton", () => {
  it("marks every trigger as an accessible menu button", () => {
    const markup = renderToStaticMarkup(
      <ContextMenuButton
        type="button"
        className="relic"
        aria-label="Star relic — choose option"
        items={[{ id: "examine", label: "Examine", target: "Star relic" }]}
      >
        Star relic
      </ContextMenuButton>,
    );

    expect(markup).toContain('aria-haspopup="menu"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('data-context-trigger="true"');
    expect(markup).toContain('class="relic"');
  });

  it("keeps pointer-opened menus inside every viewport edge", () => {
    expect(
      fitContextMenuToViewport(
        { x: 390, y: 790 },
        { width: 220, height: 180 },
        { width: 400, height: 800 },
      ),
    ).toEqual({ x: 172, y: 612 });
    expect(
      fitContextMenuToViewport(
        { x: -50, y: -20 },
        { width: 220, height: 180 },
        { width: 400, height: 800 },
      ),
    ).toEqual({ x: 8, y: 8 });
  });
});
