import { useEffect, useRef, useState } from "react";

export type ChatMessage = {
  id: number;
  kind: "welcome" | "game" | "levelup" | "broadcast" | "examine";
  text: string;
};

const CHANNELS = ["All", "Game", "Public", "Private", "Channel", "Clan"];

export function Chatbox({
  messages,
  username,
  say
}: {
  messages: ChatMessage[];
  username: string;
  say: (kind: ChatMessage["kind"], text: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const scroller = scrollRef.current;

    if (scroller) {
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleShare = async () => {
    const url = `${window.location.origin}/character/${encodeURIComponent(
      username
    )}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      say("game", "Your sheet link has been copied to the clipboard.");
    } catch {
      window.prompt("Copy this character sheet link:", url);
    }
  };

  return (
    <section className="chatbox" aria-label="Game messages">
      <div className="chat-scroll" ref={scrollRef} role="log" aria-live="polite">
        {messages.map((message) => (
          <p key={message.id} className={`chat-line chat-${message.kind}`}>
            {message.text}
          </p>
        ))}
      </div>

      <p className="chat-input-line" aria-hidden="true">
        <span className="chat-name">{username}:</span> Press Enter to Chat…
        <span className="chat-cursor">*</span>
      </p>

      <div className="chat-buttons">
        {CHANNELS.map((channel, index) => (
          <span
            key={channel}
            className={index === 0 ? "chat-channel active" : "chat-channel"}
            aria-hidden="true"
          >
            {channel}
          </span>
        ))}
        <button type="button" className="chat-share" onClick={handleShare}>
          {copied ? "Copied!" : "Share"}
        </button>
      </div>
    </section>
  );
}
