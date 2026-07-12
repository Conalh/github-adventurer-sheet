import type { ReactNode, SVGProps } from "react";
import type { SkillName } from "../lib/githubCharacter";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SwordIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 17.5 21 6V3h-3L6.5 14.5" />
      <path d="M11 19l-6-6" />
      <path d="M8 16l-4 4" />
      <path d="M5.5 21.5l-3-3" />
    </Icon>
  );
}

export function FistIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 18.5c-.9 0-1.6-.8-1.5-1.7C3 11.6 6.8 8 11.4 8h.5l.9-3.2a1.8 1.8 0 0 1 3.5 1l-.8 2.8c3.2.7 5.5 3.3 5.5 6.6 0 .7-.6 1.3-1.3 1.3h-4.4c-2.2 0-3.5 1-4.2 2z" />
      <path d="M12.8 8.4l-1 3.6" />
    </Icon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.2l6.8 2.6v5.4c0 4.3-2.9 7.2-6.8 8.9-3.9-1.7-6.8-4.6-6.8-8.9V5.8z" />
      <circle cx="12" cy="11" r="2" />
    </Icon>
  );
}

export function TargetArrowIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="13" r="7.2" />
      <circle cx="11" cy="13" r="2.8" />
      <path d="M21.2 2.8L11 13" />
      <path d="M21.2 2.8h-4.6M21.2 2.8v4.6" />
    </Icon>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        stroke="none"
        d="M11 3.2c.8 4.7 2 6.3 8.2 8.3-6.2 2-7.4 3.6-8.2 8.3-.8-4.7-2-6.3-8.2-8.3 6.2-2 7.4-3.6 8.2-8.3z"
      />
      <path
        fill="currentColor"
        stroke="none"
        d="M18.8 2.4c.3 1.9.8 2.5 3.2 3.3-2.4.8-2.9 1.4-3.2 3.3-.3-1.9-.8-2.5-3.2-3.3 2.4-.8 2.9-1.4 3.2-3.3z"
      />
    </Icon>
  );
}

export function GemIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7.5 4h9l4 5.5L12 20.5 3.5 9.5z" />
      <path d="M3.5 9.5h17" />
      <path d="M12 20.5L8.5 9.5 12 4l3.5 5.5z" />
    </Icon>
  );
}

export function PickaxeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 9C9 4.4 15 4.4 19.5 9" />
      <path d="M4.5 9c.9-.5 1.9-.8 2.9-.9M19.5 9c-.9-.5-1.9-.8-2.9-.9" />
      <path d="M12 6.5l5.6 13.6" />
    </Icon>
  );
}

export function AnvilIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        stroke="none"
        d="M3.5 6.5h17v2.2c0 1.1-.9 1.9-2 1.9h-3.7v2.9H9.2v-2.9h-.3C5.6 10.6 3.8 9 3.5 6.5z"
      />
      <path
        fill="currentColor"
        stroke="none"
        d="M8.6 14h6.8l1.8 2.6c.6.9 0 2-1 2H7.8c-1 0-1.6-1.1-1-2z"
      />
    </Icon>
  );
}

export function SunburstIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 2.5v2.8M12 18.7v2.8M2.5 12h2.8M18.7 12h2.8M5.2 5.2l2 2M16.8 16.8l2 2M18.8 5.2l-2 2M7.2 16.8l-2 2" />
    </Icon>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        stroke="none"
        d="M12 20.3C7.4 17.5 3.6 14 3.1 10.5 2.7 7.6 4.8 5 7.7 5c1.8 0 3.3.9 4.3 2.4C13 5.9 14.5 5 16.3 5c2.9 0 5 2.6 4.6 5.5-.5 3.5-4.3 7-8.9 9.8z"
      />
    </Icon>
  );
}

export const SKILL_ICONS: Record<SkillName, (props: IconProps) => ReactNode> = {
  Attack: SwordIcon,
  Strength: FistIcon,
  Defence: ShieldIcon,
  Ranged: TargetArrowIcon,
  Magic: SparkleIcon,
  Crafting: GemIcon,
  Mining: PickaxeIcon,
  Smithing: AnvilIcon,
  Prayer: SunburstIcon,
  Hitpoints: HeartIcon
};

export function CapeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7.5 3.5h9l2.8 13.7c-2.3 1.9-5 2.8-7.3 2.8s-5-.9-7.3-2.8z" />
      <path d="M7.5 3.5c1.5 1.2 3 1.8 4.5 1.8s3-.6 4.5-1.8" />
    </Icon>
  );
}

export function AmuletIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 3.5c0 4.6 2.9 7.7 6.5 7.7s6.5-3.1 6.5-7.7" />
      <path
        fill="currentColor"
        stroke="none"
        d="M12 11.6l3.4 4.5L12 21l-3.4-4.9z"
      />
    </Icon>
  );
}

export function RingIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="14.2" r="5.6" />
      <path
        fill="currentColor"
        stroke="none"
        d="M12 2.9l3 2.8-3 2.8-3-2.8z"
      />
    </Icon>
  );
}

export function BackpackIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5.5" y="7" width="13" height="13" rx="3" />
      <path d="M8.5 7V5.8A3.3 3.3 0 0 1 11.8 2.5h.4a3.3 3.3 0 0 1 3.3 3.3V7" />
      <path d="M5.5 12.5h13" />
      <path d="M9 12.5v3.5h6v-3.5" />
    </Icon>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        stroke="none"
        d="M12 3.4l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z"
      />
    </Icon>
  );
}

export function ForkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="6" cy="5.5" r="2.1" />
      <circle cx="18" cy="5.5" r="2.1" />
      <circle cx="12" cy="18.5" r="2.1" />
      <path d="M6 7.6v.9c0 2 1.6 3.6 3.6 3.6h4.8c2 0 3.6-1.6 3.6-3.6v-.9" />
      <path d="M12 12.1v4.3" />
    </Icon>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.8 12S6 5.8 12 5.8 21.2 12 21.2 12 18 18.2 12 18.2 2.8 12 2.8 12z" />
      <circle cx="12" cy="12" r="2.6" />
    </Icon>
  );
}

export function ScrollIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 3.5h7l4.5 4.5v12.5H7z" />
      <path d="M14 3.5V8h4.5" />
      <path d="M10 12.5h5M10 15.5h5" />
    </Icon>
  );
}

export function QuillIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.2 12.2a6 6 0 0 0-8.5-8.5L5 10.5V19h8.5z" />
      <path d="M16 8 3 21" />
      <path d="M17.5 15H10" />
    </Icon>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9.2H4.7a2.6 2.6 0 0 1 0-5.2H6" />
      <path d="M18 9.2h1.3a2.6 2.6 0 0 0 0-5.2H18" />
      <path d="M6 3.5h12v5.3a6 6 0 0 1-12 0z" />
      <path d="M12 14.8v3.7" />
      <path d="M8.5 21.5h7" />
    </Icon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="6.5" y="10.5" width="11" height="9.5" rx="2" />
      <path d="M9 10.5V8a3 3 0 0 1 6 0v2.5" />
    </Icon>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </Icon>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.2" />
      <path
        fill="currentColor"
        stroke="none"
        d="M15.5 8.5l-2.2 5.3-5.3 2.2 2.2-5.3z"
      />
    </Icon>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 11.2L12 4.2l7.5 7v8a1.3 1.3 0 0 1-1.3 1.3h-4.2v-5.8h-4v5.8H5.8a1.3 1.3 0 0 1-1.3-1.3z" />
    </Icon>
  );
}

export function CrownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        stroke="none"
        d="M4.2 17.2L2.8 8l4.7 3.4L12 5.2l4.5 6.2L21.2 8l-1.4 9.2z"
      />
      <path d="M4.6 20h14.8" />
    </Icon>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 14.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2" />
      <path d="M14.5 9.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 1 0 5.7 5.7l1.2-1.2" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 12.5l5 5 10-11" />
    </Icon>
  );
}

export function CrossedSwordsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 3.5L18.5 17" />
      <path d="M19 3.5L5.5 17" />
      <path d="M3.5 15l2-.5 3 3-.5 2-2.5.5-2.5-2.5z" />
      <path d="M20.5 15l-2-.5-3 3 .5 2 2.5.5 2.5-2.5z" />
    </Icon>
  );
}

export function BarChartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 20.5v-6h4v6z" />
      <path d="M10 20.5v-11h4v11z" />
      <path d="M15.5 20.5v-16h4v16z" />
      <path d="M3 20.5h18.5" />
    </Icon>
  );
}

export function HelmetIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 13v-2a7 7 0 0 1 14 0v2l-1.5 6H16l-1-4h-6l-1 4H6.5z" />
      <path d="M9.5 13h5" />
    </Icon>
  );
}

export function TorsoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 4l4 2 4-2 3.5 3.5-2.5 3-1-.8V20H8v-10.3l-1 .8-2.5-3z" />
    </Icon>
  );
}

export function LegsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 4h10l1 16h-5l-1-9-1 9H6z" />
    </Icon>
  );
}

export function GlovesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 20V9.5a4 4 0 0 1 8 0V20z" />
      <path d="M8 13H5.8a1.6 1.6 0 0 1 0-3.2H8" />
    </Icon>
  );
}

export function BootsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 4h6v7c3 1 7 3 7 6v3H4v-9z" />
      <path d="M13 11H7" />
    </Icon>
  );
}

export function ArrowsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 3v13M7 21v-2M5 17h4l-2 4z" />
      <path d="M17 3v13M17 21v-2M15 17h4l-2 4z" />
    </Icon>
  );
}

export function CrestIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2.8l7.4 2.8v5.8c0 4.7-3.1 7.9-7.4 9.8-4.3-1.9-7.4-5.1-7.4-9.8V5.6z" />
      <path
        fill="currentColor"
        stroke="none"
        d="M12 6.4l1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5z"
      />
    </Icon>
  );
}
