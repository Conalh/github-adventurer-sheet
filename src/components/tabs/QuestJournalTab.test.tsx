import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CharacterSheet } from "../../lib/githubCharacter";
import { QuestJournalTab } from "./QuestJournalTab";

describe("QuestJournalTab", () => {
  it("shows the parody title and the real repository name together", () => {
    const markup = renderToStaticMarkup(
      <QuestJournalTab
        sheet={{
          quests: [
            {
              repo: {
                id: 7,
                name: "recoverytrail",
                full_name: "ConalH/recoverytrail",
                html_url: "https://github.com/ConalH/recoverytrail",
                description: "Recover interrupted work from durable evidence.",
                language: "TypeScript",
                stargazers_count: 3,
                forks_count: 0,
              },
              title: "A Recovery Trail",
              description: "Recover interrupted work from durable evidence.",
              language: "TypeScript",
              difficulty: "Novice",
              difficultyScore: 3,
              updatedLabel: "Jul 16, 2026",
            },
          ],
          metrics: { totalRepos: 1 },
        } as CharacterSheet}
        say={() => undefined}
      />,
    );

    expect(markup).toContain("A Recovery Trail");
    expect(markup).toContain("recoverytrail");
    expect(markup).toContain("repository recoverytrail");
    expect(markup).toContain('data-context-trigger="true"');
  });
});
