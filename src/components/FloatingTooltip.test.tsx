import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  computeFloatingTooltipPosition,
  FloatingTooltip,
} from "./FloatingTooltip";

describe("computeFloatingTooltipPosition", () => {
  it("centers a tooltip above its trigger when space is available", () => {
    expect(computeFloatingTooltipPosition(
      { top: 100, right: 140, bottom: 140, left: 100, width: 40, height: 40 },
      { width: 160, height: 60 },
      { width: 800, height: 600 },
    )).toEqual({ top: 33, left: 40, placement: "above" });
  });

  it("flips below a top-edge trigger and clamps to the left viewport margin", () => {
    expect(computeFloatingTooltipPosition(
      { top: 20, right: 44, bottom: 60, left: 4, width: 40, height: 40 },
      { width: 160, height: 70 },
      { width: 200, height: 300 },
    )).toEqual({ top: 67, left: 8, placement: "below" });
  });

  it("clamps a right-edge tooltip inside the viewport", () => {
    expect(computeFloatingTooltipPosition(
      { top: 100, right: 800, bottom: 140, left: 760, width: 40, height: 40 },
      { width: 160, height: 60 },
      { width: 800, height: 600 },
    )).toEqual({ top: 33, left: 632, placement: "above" });
  });
});

describe("FloatingTooltip", () => {
  it("renders an inert trigger marker during server rendering", () => {
    const markup = renderToStaticMarkup(
      <button type="button">
        Item
        <FloatingTooltip><strong>Item details</strong></FloatingTooltip>
      </button>,
    );

    expect(markup).toContain('class="floating-tooltip-anchor"');
    expect(markup).not.toContain('class="rs-tooltip rs-tooltip--floating"');
  });
});
