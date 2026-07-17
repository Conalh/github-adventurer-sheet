import { useCallback, useMemo, useState, type ReactNode, type SVGProps } from "react";
import {
  getAchievements,
  type CharacterSheet
} from "../lib/githubCharacter";
import {
  BarChartIcon,
  CrossedSwordsIcon,
  HelmetIcon,
  SparkleIcon,
  TrophyIcon
} from "./icons";
import { Chatbox, type ChatMessage } from "./Chatbox";
import { Viewport } from "./Viewport";
import { SkillsTab } from "./tabs/SkillsTab";
import { EquipmentTab } from "./tabs/EquipmentTab";
import { QuestJournalTab } from "./tabs/QuestJournalTab";
import { DeedsTab } from "./tabs/DeedsTab";
import { SummaryTab } from "./tabs/SummaryTab";

export type TabId = "combat" | "skills" | "quests" | "equipment" | "deeds";

const TABS: Array<{
  id: TabId;
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => ReactNode;
}> = [
  { id: "combat", label: "Character summary", icon: CrossedSwordsIcon },
  { id: "skills", label: "Skills", icon: BarChartIcon },
  { id: "quests", label: "Quest journal", icon: SparkleIcon },
  { id: "equipment", label: "Worn equipment", icon: HelmetIcon },
  { id: "deeds", label: "Deed diary", icon: TrophyIcon }
];

export function GameClient({
  sheet,
  isDemo
}: {
  sheet: CharacterSheet;
  isDemo: boolean;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("skills");
  const [extraMessages, setExtraMessages] = useState<ChatMessage[]>([]);

  const openingMessages = useMemo(
    () => buildOpeningMessages(sheet, isDemo),
    [sheet, isDemo]
  );

  const say = useCallback((kind: ChatMessage["kind"], text: string) => {
    setExtraMessages((current) => [
      ...current.slice(-40),
      { id: Date.now() + Math.random(), kind, text }
    ]);
  }, []);

  const messages = useMemo(
    () => [...openingMessages, ...extraMessages],
    [openingMessages, extraMessages]
  );

  return (
    <div className="client-frame">
      <i className="rivet tl" aria-hidden="true" />
      <i className="rivet tr" aria-hidden="true" />
      <i className="rivet bl" aria-hidden="true" />
      <i className="rivet br" aria-hidden="true" />

      <div className="client-body">
        <Viewport sheet={sheet} say={say} />

        <aside className="sidebar">
          <div className="tab-strip" role="tablist" aria-label="Interface tabs">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              const active = tab.id === activeTab;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={active}
                  aria-controls={`tabpanel-${tab.id}`}
                  className={active ? "tab-button active" : "tab-button"}
                  title={tab.label}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <TabIcon />
                  <span className="visually-hidden">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div
            className="tab-panel"
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
          >
            {activeTab === "combat" ? (
              <SummaryTab sheet={sheet} say={say} />
            ) : null}
            {activeTab === "skills" ? (
              <SkillsTab sheet={sheet} say={say} />
            ) : null}
            {activeTab === "quests" ? (
              <QuestJournalTab sheet={sheet} say={say} />
            ) : null}
            {activeTab === "equipment" ? (
              <EquipmentTab sheet={sheet} say={say} />
            ) : null}
            {activeTab === "deeds" ? (
              <DeedsTab sheet={sheet} say={say} />
            ) : null}
          </div>
        </aside>
      </div>

      <Chatbox messages={messages} username={sheet.user.login} say={say} />
    </div>
  );
}

function buildOpeningMessages(
  sheet: CharacterSheet,
  isDemo: boolean
): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const displayName = sheet.user.name || sheet.user.login;
  let id = 1;

  messages.push({
    id: id++,
    kind: "welcome",
    text: sheet.prestige.title
      ? `Welcome to World 404, ${sheet.prestige.title} ${displayName}.`
      : "Welcome to World 404."
  });

  if (isDemo) {
    messages.push({
      id: id++,
      kind: "game",
      text: "This is the default demo hero. Summon any GitHub name to roll another adventurer."
    });
  }

  if (sheet.prestige.ninetyNines.length > 0) {
    for (const skill of sheet.prestige.ninetyNines.slice(0, 3)) {
      messages.push({
        id: id++,
        kind: "broadcast",
        text: `News: ${displayName} has achieved level 99 in ${skill}!`
      });
    }

    if (sheet.prestige.trimmed) {
      messages.push({
        id: id++,
        kind: "game",
        text: `Your ${sheet.prestige.capeSkill} Skillcape has been trimmed with gold.`
      });
    }
  } else {
    messages.push({
      id: id++,
      kind: "levelup",
      text: `Congratulations, you just advanced a ${sheet.strongestSkill} level. Your ${sheet.strongestSkill} level is now ${sheet.skills[sheet.strongestSkill]}.`
    });

    const earned = getAchievements(sheet.user, sheet.metrics).filter(
      (achievement) => achievement.earned
    );

    for (const achievement of earned.slice(0, 3)) {
      messages.push({
        id: id++,
        kind: "broadcast",
        text: `News: ${displayName} has completed the "${achievement.name}" deed!`
      });
    }
  }

  messages.push({
    id: id++,
    kind: "game",
    text: `You have ${sheet.metrics.totalRepos.toLocaleString()} public quests in your journal.`
  });

  return messages;
}
