import type { CSSProperties } from "react";

export function Embers() {
  const embers = Array.from({ length: 16 }, (_, index) => {
    const style = {
      left: `${(index * 53 + 7) % 100}%`,
      animationDuration: `${9 + ((index * 97) % 9)}s`,
      animationDelay: `-${(index * 31) % 14}s`,
      width: `${2 + ((index * 13) % 4)}px`,
      height: `${2 + ((index * 13) % 4)}px`,
      "--max-o": 0.3 + ((index * 17) % 40) / 100
    } as CSSProperties;

    return <span key={index} style={style} />;
  });

  return (
    <div className="embers" aria-hidden="true">
      {embers}
    </div>
  );
}
