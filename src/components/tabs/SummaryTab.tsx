import { formatDate, type CharacterSheet } from "../../lib/githubCharacter";
import type { ChatMessage } from "../Chatbox";
import { ContextMenuButton } from "../ContextMenuButton";
import { CrossedSwordsIcon } from "../icons";

export function SummaryTab({
  sheet,
  say
}: {
  sheet: CharacterSheet;
  say: (kind: ChatMessage["kind"], text: string) => void;
}) {
  const displayName = sheet.user.name || sheet.user.login;
  const facts: Array<[string, string]> = [
    ["Class", sheet.characterClass],
    ["Specialty", `${sheet.strongestSkill}`],
    ["Location", sheet.user.location || "Unlisted"],
    ["Company", sheet.user.company || "Unlisted"],
    ["Joined", formatDate(sheet.user.created_at)],
    ["Followers", sheet.user.followers.toLocaleString()],
    ["Following", sheet.user.following.toLocaleString()],
    ["Public repos", sheet.user.public_repos.toLocaleString()]
  ];

  return (
    <div className="summary-tab">
      <header className="rs-tab-heading">
        <h3>Character</h3>
        <span className="quest-points">@{sheet.user.login}</span>
      </header>

      <ContextMenuButton
        type="button"
        className="combat-plaque"
        items={[
          {
            id: "lookup",
            label: "Look up",
            target: displayName,
            onSelect: () =>
              say(
                "game",
                `${displayName} is ranked on World 404 with total level ${sheet.totalLevel}.`,
              ),
          },
          {
            id: "examine",
            label: "Examine",
            target: displayName,
            onSelect: () =>
              say(
                "examine",
                `${displayName}: a ${sheet.characterClass.toLowerCase()} of combat level ${sheet.combatLevel} and total level ${sheet.totalLevel}.`,
              ),
          },
        ]}
      >
        <span className="combat-plaque-icon" aria-hidden="true">
          <CrossedSwordsIcon />
        </span>
        <span className="combat-plaque-copy">
          Combat level
          <strong>{sheet.combatLevel}</strong>
        </span>
        <span className="combat-plaque-copy">
          Total level
          <strong>{sheet.totalLevel}</strong>
        </span>
      </ContextMenuButton>

      <dl className="summary-facts">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        {sheet.user.blog ? (
          <div>
            <dt>Blog</dt>
            <dd>
              <a
                href={toExternalUrl(sheet.user.blog)}
                target="_blank"
                rel="noreferrer"
              >
                {sheet.user.blog}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function toExternalUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}
