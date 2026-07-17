// @ts-expect-error The browser app intentionally omits Node typings; Vitest supplies this at runtime.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readRootFile = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("public release surface", () => {
  it("publishes consistent repository metadata", () => {
    const packageJson = JSON.parse(readRootFile("package.json"));

    expect(packageJson.name).toBe("github-adventurer-sheet");
    expect(packageJson.private).toBe(true);
    expect(packageJson.license).toBe("MIT");
    expect(packageJson.engines.node).toBe(">=22.12.0");
    expect(packageJson.homepage).toBe("https://osrshub.pages.dev");
    expect(packageJson.repository.url).toContain(
      "Conalh/github-adventurer-sheet"
    );

    expect(readRootFile("LICENSE")).toContain("MIT License");
    expect(readRootFile("CONTRIBUTING.md")).toContain("npm run build");
    expect(readRootFile("SECURITY.md")).toContain("Report a vulnerability");
  });

  it("advertises the canonical live site", () => {
    const html = readRootFile("index.html");
    const readme = readRootFile("README.md");

    expect(html).toContain(
      '<link rel="canonical" href="https://osrshub.pages.dev/" />'
    );
    expect(html).toContain('<meta property="og:title"');
    expect(html).toContain('<meta name="twitter:card"');
    expect(readme).toContain("https://osrshub.pages.dev/character/ConalH");
    expect(readme).toContain("public/adventurer-sheet.png");
    expect(html).toContain("https://osrshub.pages.dev/adventurer-sheet.png");
    expect(readRootFile("public/_redirects")).toContain("/index.html 200");
    expect(readRootFile("public/robots.txt")).toContain(
      "https://osrshub.pages.dev/sitemap.xml"
    );
  });

  it("constrains the hosted browser surface", () => {
    const headers = readRootFile("public/_headers");

    expect(headers).toContain("Content-Security-Policy:");
    expect(headers).toContain("connect-src 'self' https://api.github.com");
    expect(headers).toContain("https://avatars.githubusercontent.com");
    expect(headers).toContain("frame-ancestors 'none'");
    expect(headers).toContain("X-Content-Type-Options: nosniff");
  });

  it("pins external workflow actions and bounds every job", () => {
    for (const name of ["ci.yml", "deploy-pages.yml"]) {
      const workflow = readRootFile(`.github/workflows/${name}`);
      const actionRefs = [...workflow.matchAll(/^\s*uses:\s+([^\s#]+)/gm)].map(
        (match) => match[1]
      );

      expect(workflow).toContain("timeout-minutes:");
      expect(actionRefs.length).toBeGreaterThan(0);
      for (const ref of actionRefs) {
        expect(ref).toMatch(/@[a-f0-9]{40}$/i);
      }
    }
  });
});
