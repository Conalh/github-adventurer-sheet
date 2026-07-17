import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InnRoom } from "./InnRoom";

describe("InnRoom", () => {
  it("renders one inert room with focused illustrated furniture", () => {
    const markup = renderToStaticMarkup(<InnRoom />);

    expect(markup).toContain('class="inn-room inn-room--guild"');
    expect(markup).toContain('data-realm-tier="1"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('class="inn-wall-frame"');
    expect(markup.match(/class="inn-furniture inn-table inn-table--/g)).toHaveLength(2);
    expect(markup).toContain('class="inn-furniture inn-counter"');
    expect(markup).toContain('class="inn-furniture inn-hearth"');
    expect(markup).not.toContain("aria-label=");
    expect(markup).not.toContain("tabindex=");
  });

  it("gives tables top planes, planks, legs, benches, and shadows", () => {
    const markup = renderToStaticMarkup(<InnRoom />);

    expect(markup.match(/class="inn-table-top"/g)).toHaveLength(2);
    expect(markup.match(/class="inn-table-bevel"/g)).toHaveLength(2);
    expect(markup.match(/class="inn-table-planks"/g)).toHaveLength(2);
    expect(markup.match(/class="inn-table-legs"/g)).toHaveLength(2);
    expect(markup.match(/class="inn-bench"/g)).toHaveLength(2);
    expect(markup.match(/class="inn-contact-shadow"/g)).toHaveLength(4);
  });

  it("builds the hearth from masonry, an arched firebox, logs, and layered flame", () => {
    const markup = renderToStaticMarkup(<InnRoom />);

    expect(markup).toContain('class="inn-hearth-stones"');
    expect(markup).toContain('class="inn-firebox"');
    expect(markup).toContain('class="inn-fire-logs"');
    expect(markup).toContain('class="inn-flame inn-flame--outer"');
    expect(markup).toContain('class="inn-flame inn-flame--inner"');
    expect(markup).toContain('class="inn-hearth-mantle"');
  });
});
