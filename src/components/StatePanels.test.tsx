import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ErrorState, LoadingState } from "./StatePanels";

describe("World 404 connection panels", () => {
  it("starts with a truthful profile-server connection phase", () => {
    const markup = renderToStaticMarkup(<LoadingState username="ConalH" />);

    expect(markup).toContain("World 404");
    expect(markup).toContain("Connecting to World 404");
    expect(markup).toContain("@ConalH");
    expect(markup).toContain('data-connection-phase="1"');
    expect(markup).toContain('aria-busy="true"');
  });

  it("uses old-school connection copy without hiding the useful error", () => {
    const markup = renderToStaticMarkup(
      <ErrorState
        kind="rate_limit"
        message="GitHub API rate limit exceeded."
        username="ConalH"
        onRetry={() => undefined}
      />,
    );

    expect(markup).toContain("This world is full");
    expect(markup).toContain("GitHub API rate limit exceeded.");
    expect(markup).toContain("Try again");
  });
});
