import type { CSSProperties, ReactNode } from "react";
import type { Rarity } from "../lib/githubCharacter";

export function Panel({
  as: Tag = "section",
  className,
  children,
  ...rest
}: {
  as?: "section" | "div";
  className?: string;
  children: ReactNode;
  [key: string]: unknown;
}) {
  return (
    <Tag className={className ? `panel ${className}` : "panel"} {...rest}>
      <i className="panel-corner tl" aria-hidden="true" />
      <i className="panel-corner tr" aria-hidden="true" />
      <i className="panel-corner bl" aria-hidden="true" />
      <i className="panel-corner br" aria-hidden="true" />
      {children}
    </Tag>
  );
}

export function PanelHeading({
  id,
  icon,
  title,
  note
}: {
  id: string;
  icon?: ReactNode;
  title: string;
  note?: string;
}) {
  return (
    <header className="panel-heading">
      <h2 id={id}>
        {icon ? <span className="heading-icon">{icon}</span> : null}
        {title}
      </h2>
      {note ? <p>{note}</p> : null}
    </header>
  );
}

export function Flourish({ label }: { label?: string }) {
  return (
    <div className="flourish" aria-hidden={label ? undefined : true}>
      <span className="flourish-line" />
      <span className="flourish-gem">{label ?? "❖"}</span>
      <span className="flourish-line" />
    </div>
  );
}

export function RarityTag({ rarity }: { rarity: Rarity }) {
  return (
    <span className={`rarity-tag rarity-${rarity.toLowerCase()}`}>
      {rarity}
    </span>
  );
}

export function Embers() {
  const embers = Array.from({ length: 18 }, (_, index) => {
    const style = {
      left: `${(index * 53 + 7) % 100}%`,
      animationDuration: `${9 + ((index * 97) % 9)}s`,
      animationDelay: `-${(index * 31) % 14}s`,
      width: `${3 + ((index * 13) % 4)}px`,
      height: `${3 + ((index * 13) % 4)}px`,
      "--max-o": 0.35 + ((index * 17) % 40) / 100
    } as CSSProperties;

    return <span key={index} style={style} />;
  });

  return (
    <div className="embers" aria-hidden="true">
      {embers}
    </div>
  );
}
