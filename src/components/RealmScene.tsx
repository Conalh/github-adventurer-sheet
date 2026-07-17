import type { PrestigeTier } from "../lib/githubCharacter";
import { InnRoom } from "./InnRoom";

export function RealmScene({ tier }: { tier: PrestigeTier }) {
  if (tier === 3) return <LegendHall />;

  return <InnRoom realmTier={tier} />;
}

export function LegendHall() {
  return (
    <div className="legend-hall" aria-hidden="true">
      <span className="legend-stars">
        {Array.from({ length: 12 }, (_, index) => (
          <i key={index} />
        ))}
      </span>
      <svg
        className="legend-architecture"
        viewBox="0 0 1000 520"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path className="legend-vault" d="M0 0h1000v520H0z" />
        <path className="legend-floor" d="M0 352h1000v168H0z" />
        <path
          className="legend-floor-lines"
          d="M0 389h1000M0 438h1000M0 492h1000M500 352v168M285 352 190 520M715 352l95 168M120 352 0 455M880 352l120 103"
        />
        <path
          className="legend-outer-arch"
          d="M42 520V176Q42 30 190 30h620q148 0 148 146v344"
        />
        <path
          className="legend-inner-arch"
          d="M112 520V194Q112 92 220 92h560q108 0 108 102v326"
        />
        <path
          className="legend-column legend-column--left"
          d="M58 151h82v369H58z"
        />
        <path
          className="legend-column legend-column--right"
          d="M860 151h82v369h-82z"
        />
        <path
          className="legend-column-cap"
          d="M42 132h114v32H42zM844 132h114v32H844z"
        />
        <path
          className="legend-column-gold"
          d="M74 164h14v356H74zM912 164h14v356h-14z"
        />
        <path className="legend-dais" d="M315 451h370l48 69H267z" />
        <path className="legend-dais-step" d="M285 482h430l18 38H267z" />
      </svg>
      <span className="legend-sigil"><i /></span>
      <span className="legend-brazier legend-brazier--left"><i /></span>
      <span className="legend-brazier legend-brazier--right"><i /></span>
      <span className="legend-statue legend-statue--left"><i /><b /></span>
      <span className="legend-statue legend-statue--right"><i /><b /></span>
    </div>
  );
}
