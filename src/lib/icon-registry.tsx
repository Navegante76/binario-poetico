import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CircleDashed } from "lucide-react";

/* ----------------------------------------------------------------
 *  Brand icons (SVG paths) — lucide-react is brand-free, so we ship
 *  inline SVG data for the most common social platforms. Each entry
 *  is a function returning a `<svg>` rendered with `currentColor` so
 *  Tailwind text colors propagate normally.
 * ---------------------------------------------------------------- */

type RenderProps = { className?: string; size?: number };

type BrandIconFn = (p?: RenderProps) => React.ReactElement;

const svg = (
  d: string | React.ReactNode,
  opts: { fill?: "solid" | "outline"; viewBox?: string } = {
    fill: "solid",
    viewBox: "0 0 24 24",
  },
): BrandIconFn => {
  return ({ className, size } = {}) => {
    const w = size ?? 24;
    const h = size ?? 24;
    const fillMode = opts.fill ?? "solid";
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={opts.viewBox ?? "0 0 24 24"}
        width={w}
        height={h}
        className={className}
        fill={fillMode === "solid" ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={fillMode === "solid" ? 0 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {typeof d === "string" ? <path d={d} /> : d}
      </svg>
    );
  };
};

/** Recognised social / brand icon names shipped with the site. */
export const BRAND_ICON_NAMES = [
  "facebook",
  "instagram",
  "x",
  "youtube",
  "linkedin",
  "tiktok",
  "whatsapp",
  "telegram",
  "discord",
  "threads",
  "pinterest",
  "snapchat",
  "reddit",
  "twitch",
  "spotify",
  "github",
  "apple",
  "google",
  "mastodon",
  "bluesky",
] as const;

export type BrandIconName = (typeof BRAND_ICON_NAMES)[number];

/**
 * Brand icon registry. Each entry renders a small inline SVG with the
 * platform's recognisable shape. Audited for offline use, no external
 * dependencies on `simple-icons` etc.
 */
export const BRAND_ICONS: Record<string, BrandIconFn> = {
  facebook: svg(
    "M13.5 22v-8.5h2.85l.43-3.32H13.5V8.003c0-.96.27-1.62 1.65-1.62H17V3.422A23.5 23.5 0 0 0 14.66 3.25c-2.7 0-4.55 1.65-4.55 4.67v2.26H7.27v3.32h2.84V22h3.39z",
  ),
  instagram: svg(
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" fill="none" />
      <circle cx="17.2" cy="6.8" r="1.1" stroke="white" strokeWidth="1.5" fill="none" />
    </>,
  ),
  x: svg(
    "M18.244 2H21l-6.51 7.43L22 22h-6.79l-4.71-6.16L4.71 22H2l7.04-8.04L2 2h6.79l4.27 5.62L18.244 2zm-1.18 18h1.86L7.05 4H5.06l12.004 16z",
  ),
  youtube: svg(
    <>
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <path d="M10 9l5 3-5 3z" stroke="white" strokeWidth="1.5" fill="white" />
    </>,
  ),
  linkedin: sg("linkedin"),
  tiktok: sg("tiktok"),
  whatsapp: sg("whatsapp"),
  telegram: sg("telegram"),
  discord: sg("discord"),
  threads: sg("threads"),
  pinterest: sg("pinterest"),
  snapchat: sg("snapchat"),
  reddit: sg("reddit"),
  twitch: sg("twitch"),
  spotify: sg("spotify"),
  github: sg("github"),
  apple: sg("apple"),
  google: sg("google"),
  mastodon: sg("mastodon"),
  bluesky: sg("bluesky"),
};

/* ----------------------------------------------------------------
 *  Public API
 * ---------------------------------------------------------------- */

/** True when the value looks like a URL (absolute or site-relative). */
export function isIconUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("data:image/") ||
    value.startsWith("blob:")
  );
}

/** True when the value resolves to a known brand icon. */
export function isBrandIcon(value: string | null | undefined): boolean {
  if (!value) return false;
  return Object.prototype.hasOwnProperty.call(BRAND_ICONS, value.toLowerCase());
}

/**
 * Resolves a Lucide icon by name, OR a brand SVG by name, OR a remote/data
 * image URL.
 *  - "Wrench", "Gauge" → Lucide React component.
 *  - "facebook", "instagram" → brand SVG with currentColor.
 *  - "https://example.com/logo.png" or "/assets/logo.svg" → <img>.
 */
export function DynamicIcon({
  name,
  className,
  strokeWidth,
  size,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
  size?: number;
}): React.ReactElement {
  if (!name) {
    return <CircleDashed className={className} aria-hidden />;
  }

  if (isIconUrl(name)) {
    return (
      <img
        src={name}
        className={className}
        alt=""
        aria-hidden
        draggable={false}
        style={{
          objectFit: "contain",
          width: size,
          height: size,
        }}
      />
    );
  }

  const brand = BRAND_ICONS[name.toLowerCase()];
  if (brand) {
    return brand({ className, size });
  }

  const icons = Lucide as unknown as Record<string, LucideIcon | undefined>;
  const Icon = icons[name] ?? CircleDashed;
  return (
    <Icon
      className={className}
      strokeWidth={strokeWidth}
      size={size}
      aria-hidden
    />
  );
}

/** Built-in list of curated Lucide icons shown in the dev icon picker. */
export const ICON_PICKER_LIBRARY: string[] = [
  "Wrench", "Settings", "Cog", "Hammer", "Activity",
  "Gauge", "Monitor", "Cpu", "Zap", "Sparkles",
  "Car", "Truck", "Bike", "Bus", "Tractor",
  "Droplets", "Droplet", "Beaker", "FlaskConical", "TestTube",
  "Disc3", "Disc2", "Disc", "CircleDot", "Octagon",
  "Battery", "BatteryCharging", "Plug", "Power", "Cable",
  "Snowflake", "ThermometerSun", "Thermometer", "Sun", "Cloud",
  "PaintBucket", "Brush", "Palette", "Pen", "PaintRoller",
  "Award", "Trophy", "Medal", "Crown", "Star",
  "BadgeCheck", "CheckCircle", "CheckCircle2", "CircleCheckBig", "BadgeAlert",
  "ShieldCheck", "Shield", "ShieldPlus", "ShieldAlert", "Lock",
  "Clock", "Timer", "Hourglass", "CalendarCheck", "Calendar",
  "Handshake", "UserCheck", "Users", "User", "UserPlus",
  "Heart", "HeartHandshake", "Coffee", "Smile", "ThumbsUp",
  "Phone", "PhoneCall", "Mail", "MessageSquare", "MessageCircle",
  "MapPin", "Map", "Navigation", "Compass", "Locate",
  "Camera", "Image", "Aperture", "Eye", "ScanLine",
  "Share", "Share2", "Globe", "Link", "AtSign", "Hash", "Send",
];

/** A value is considered "valid" if it's a URL, brand icon, or Lucide name. */
export function isValidIcon(name: string): boolean {
  if (!name) return false;
  if (isIconUrl(name)) return true;
  if (isBrandIcon(name)) return true;
  const icons = Lucide as unknown as Record<string, LucideIcon | undefined>;
  return typeof icons[name] !== "undefined";
}

/* ----------------------------------------------------------------
 *  Brand SVG generator (compact markdown-style shapes).
 *  Kept minimal but recognizable. Each function renders an svg with
 *  currentColor and a 24x24 viewBox.
 * ---------------------------------------------------------------- */
function sg(name: string): BrandIconFn {
  // tiny table of path data, fill currentColor
  const data: Record<string, string> = {
    linkedin:
      "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7.5 0h3.8v1.65h.05c.53-1 1.83-2.05 3.77-2.05 4.04 0 4.78 2.66 4.78 6.12V21h-4v-5.45c0-1.3-.02-2.97-1.81-2.97-1.81 0-2.09 1.41-2.09 2.87V21h-4V9z",
    tiktok:
      "M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.6 2.5 2.59 2.59 0 0 1-1.7-.61 2.6 2.6 0 0 0 4.34-1.89V5.82zM21 8.13a4.37 4.37 0 0 1-4.4-2.18v9.45a6.55 6.55 0 1 1-5.55-6.49v3.07a3.49 3.49 0 1 0 2.45 3.42V3h2.95a4.36 4.36 0 0 0 4.55 5.13z",
    whatsapp:
      "M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.18 1.6 6L0 24l6.2-1.62A11.93 11.93 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.21-3.48-8.52zM12 21.82a9.85 9.85 0 0 1-5.02-1.37l-.36-.21-3.68.96.98-3.59-.23-.37A9.85 9.85 0 1 1 21.85 12 9.85 9.85 0 0 1 12 21.82zm5.46-7.41c-.3-.15-1.77-.87-2.05-.97s-.47-.15-.67.15-.77.97-.94 1.17-.35.22-.65.07a8.07 8.07 0 0 1-2.37-1.46 8.93 8.93 0 0 1-1.65-2.05c-.17-.3 0-.46.13-.61s.3-.35.45-.52a2 2 0 0 0 .3-.5c.1-.22 0-.4-.05-.55s-.67-1.61-.92-2.2-.49-.5-.67-.51h-.57a1.1 1.1 0 0 0-.8.37 3.34 3.34 0 0 0-1.05 2.49 5.81 5.81 0 0 0 1.21 3.08 13.31 13.31 0 0 0 5.1 4.5c.71.31 1.27.49 1.7.62a4.14 4.14 0 0 0 1.89.12 3.1 3.1 0 0 0 2.03-1.44 2.51 2.51 0 0 0 .18-1.44c-.07-.12-.27-.2-.57-.35z",
    telegram:
      "M22.05 2.07 1.7 10.3c-1.31.51-1.3 1.23-.24 1.55l5.21 1.62 2.02 6.16c.25.7.12.97.86.97.55 0 .8-.25 1.1-.55l2.85-2.77 5.93 4.38c1.09.6 1.88.28 2.16-1.02L23.94 3.5c.4-1.55-.6-2.25-1.89-1.43zM19.27 7.07l-9.3 8.4-.36 4.05-1.83-5.59 12.27-7.5c.55-.34 1.04-.04.79.32z",
    discord:
      "M20.32 4.69A19.79 19.79 0 0 0 15.4 3l-.21.4a18.43 18.43 0 0 0-2.4-.13 18.5 18.5 0 0 0-2.4.13L10.18 3a19.79 19.79 0 0 0-4.92 1.69C2.05 8.45 1.4 12.11 1.7 15.71a19.94 19.94 0 0 0 6.07 3.06c.49-.66.93-1.37 1.31-2.11a12.7 12.7 0 0 1-2.06-.99c.17-.13.34-.26.5-.4a14.21 14.21 0 0 0 12.05 0c.17.14.34.27.5.4-.66.39-1.36.72-2.07.99.39.74.83 1.45 1.32 2.11a19.91 19.91 0 0 0 6.06-3.06c.34-4.2-.6-7.83-3.06-11.02zM8.52 14.05a2.18 2.18 0 0 1-2-2.32 2.18 2.18 0 0 1 2-2.32 2.18 2.18 0 0 1 2 2.32 2.18 2.18 0 0 1-2 2.32zm6.96 0a2.18 2.18 0 0 1-2-2.32 2.18 2.18 0 0 1 2-2.32 2.18 2.18 0 0 1 2 2.32 2.18 2.18 0 0 1-2 2.32z",
    threads:
      "M16.85 11.32c-.08-.05-.14-.1-.22-.14a6.97 6.97 0 0 0-.21-3.62 4.6 4.6 0 0 0-4.51-3.07 5.84 5.84 0 0 0-4.85 2.4l1.66 1.14a3.84 3.84 0 0 1 3.19-1.61 2.66 2.66 0 0 1 2.65 1.84 4.84 4.84 0 0 1 .2 2.55 14.6 14.6 0 0 0-2.27-.32 6.66 6.66 0 0 0-5.78 2.95 3.39 3.39 0 0 0-.14 3.39 3.06 3.06 0 0 0 2.83 1.61 4.86 4.86 0 0 0 4.45-2.7 13.07 13.07 0 0 0 1.41 4.36l1.86-.71a11.36 11.36 0 0 1-1.41-5.34v-.04a4.55 4.55 0 0 0 2.65 1.21l.34-2.07a2.45 2.45 0 0 1-1.85-.93zm-4.6 4.03a2.85 2.85 0 0 1-2.59 1.6 1.21 1.21 0 0 1-1.13-.66 1.39 1.39 0 0 1 .06-1.43 4.7 4.7 0 0 1 4.07-2.07 12.2 12.2 0 0 1 1.18.06 4.55 4.55 0 0 1-1.59 2.5z",
    pinterest:
      "M12 0a12 12 0 0 0-4.5 23.18c-.1-.94-.2-2.4.04-3.44l1.4-5.94s-.36-.71-.36-1.77c0-1.66.96-2.9 2.16-2.9 1.02 0 1.51.77 1.51 1.69 0 1.03-.66 2.57-1 4a1.99 1.99 0 0 0 2.04 2.49c2.45 0 4.32-2.58 4.32-6.31 0-3.3-2.37-5.6-5.76-5.6-3.92 0-6.22 2.94-6.22 5.98 0 1.18.46 2.45 1.02 3.14.11.13.13.25.1.39l-.38 1.56c-.06.25-.2.3-.46.18-1.7-.79-2.76-3.27-2.76-5.27 0-4.29 3.12-8.23 9-8.23 4.73 0 8.4 3.37 8.4 7.87 0 4.7-2.96 8.48-7.07 8.48-1.38 0-2.68-.72-3.13-1.57l-.85 3.25a14.43 14.43 0 0 1-1.7 3.57A12 12 0 1 0 12 0z",
    snapchat:
      "M12 2.16c3.2 0 5.4 1.85 5.4 4.86 0 1.16-.07 2.44-.27 4 1.04.5 2.31.78 3.5.78.4 0 .6.44.34.78-.5.65-1.86 1.5-3.27 1.7.6 1.4 2.05 3.05 4.45 3.4.27.05.42.36.25.6-.34.52-1.42 1.5-3.45 1.66.13.4.27.85.27 1.32 0 .2-.13.36-.27.4-2.04.45-3.6 1.27-4.6 2.16-.7.65-2.32 2.16-3.36 2.16-1.04 0-2.66-1.5-3.36-2.16-1-.9-2.56-1.71-4.6-2.16a.46.46 0 0 1-.27-.4c0-.47.13-.92.27-1.32-2.03-.16-3.11-1.14-3.45-1.66a.43.43 0 0 1 .25-.6c2.4-.35 3.84-2 4.45-3.4-1.4-.2-2.77-1.05-3.27-1.7-.27-.34-.07-.78.34-.78 1.18 0 2.46-.27 3.5-.78-.2-1.56-.27-2.84-.27-4 0-3.01 2.2-4.86 5.4-4.86z",
    reddit:
      "M12 0a12 12 0 0 0-12 12c0 2.97 1.07 5.69 2.85 7.78l-2.27 4.22 4.85-2.62a11.93 11.93 0 0 0 4.57.96c.5 0 1-.03 1.49-.09a4 4 0 0 0 7.55-2.02 4 4 0 0 0-1.5-3.07V12c0-6.63-5.37-12-12-12zM6 12a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm12 4a4 4 0 0 1-4 4 4 4 0 0 1-2.5-.88 4 4 0 0 1-1.04-1.32h-2.46a4 4 0 0 1-2.04-3.65 4 4 0 0 1 4-4h6.04a4 4 0 0 1 2 4.85z",
    twitch:
      "M4 2 2 6v14h5v4h3l4-4h5l6-6V2H4zm16 11-3 3h-5l-4 4v-4H6V4h14v9zM15 7h-2v6h2V7zm-5 0H8v6h2V7z",
    spotify:
      "M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.5 17.32a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.11-10.55-1.16a.75.75 0 0 1-.34-1.46c4.55-1.04 8.49-.6 11.65 1.34.36.22.48.69.27 1.03zm1.46-3.4a.94.94 0 0 1-1.29.31c-3.23-1.99-8.16-2.56-11.99-1.4a.94.94 0 1 1-.55-1.79c4.4-1.34 9.85-.71 13.55 1.59.45.27.6.85.28 1.29zm.13-3.55c-3.88-2.3-10.28-2.51-13.97-1.39a1.13 1.13 0 1 1-.66-2.16c4.25-1.3 11.27-1.04 15.7 1.6a1.13 1.13 0 0 1-1.07 1.95z",
    github:
      "M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.13c-3.2.69-3.87-1.36-3.87-1.36-.52-1.32-1.28-1.67-1.28-1.67-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.17a11 11 0 0 1 5.79 0c2.2-1.48 3.18-1.17 3.18-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.26 5.65.42.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.55 4.57-1.52 7.85-5.83 7.85-10.91C23.5 5.65 18.35.5 12 .5z",
    apple:
      "M16.4 12.85a4.34 4.34 0 0 1 2.07-3.64 4.36 4.36 0 0 0-3.43-1.86c-1.45-.15-2.83.86-3.56.86-.74 0-1.86-.84-3.06-.82a4.6 4.6 0 0 0-3.87 2.36c-1.66 2.88-.42 7.13 1.18 9.46.78 1.13 1.71 2.4 2.93 2.36 1.18-.05 1.62-.77 3.04-.77 1.41 0 1.81.77 3.06.75 1.27-.02 2.07-1.16 2.84-2.29a10.74 10.74 0 0 0 1.35-2.62 4.2 4.2 0 0 1-2.55-3.79zM13.85 5.4a4.4 4.4 0 0 0 1-3.16 4.46 4.46 0 0 0-2.92 1.5 4.1 4.1 0 0 0-1.04 3 3.7 3.7 0 0 0 2.96-1.34z",
    google:
      "M22.5 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.92a5.06 5.06 0 0 1-2.2 3.32v2.75h3.55c2.08-1.91 3.28-4.73 3.28-8.1zM12 23c2.97 0 5.46-.98 7.28-2.66l-3.55-2.75a6.85 6.85 0 0 1-3.73 1.04c-2.87 0-5.3-1.94-6.16-4.55H2.18v2.85A11 11 0 0 0 12 23zM5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.85zM12 5.38c1.62 0 3.06.55 4.21 1.65l3.15-3.15C17.45 2.18 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.85C6.7 7.32 9.13 5.38 12 5.38z",
    mastodon:
      "M21.32 8.06c0-4.18-2.74-5.41-2.74-5.41A17 17 0 0 0 12 1.5a17 17 0 0 0-6.58 1.15S2.68 3.88 2.68 8.06c0 1.43.02 3.13.05 4.93.11 6.06.83 12.04 4.86 13.51 1.86.68 3.46.83 4.74.73 2.32-.16 3.62-.81 3.62-.81l-.08-1.7s-1.65.52-3.51.46c-1.83-.07-3.77-.21-4.07-2.45a4.78 4.78 0 0 1-.04-.62s1.8.44 4.1.55c1.4.06 2.71-.08 4.04-.24 2.56-.3 4.8-1.88 5.08-3.32.45-2.27.42-5.54.42-5.54zm-3.62 5.77h-2.24V8.69c0-1.16-.49-1.74-1.46-1.74-1.07 0-1.61.7-1.61 2.07v3h-2.22v-3c0-1.37-.54-2.07-1.62-2.07-.96 0-1.46.58-1.46 1.74v5.14H4.86V8.52c0-1.16.3-2.08.88-2.76.6-.68 1.4-1.03 2.39-1.03 1.15 0 2.02.44 2.6 1.32l.55.92.55-.92c.58-.88 1.45-1.32 2.6-1.32 1 0 1.79.35 2.39 1.03.59.68.89 1.6.89 2.76v5.31z",
    bluesky:
      "M5.5 4.85C8.85 7.34 12 12.36 12 12.36s3.15-5.02 6.5-7.51c2.4-1.78 6.3-3.15 6.3 1.35 0 .88-.5 7.34-1.34 8.34-1.74 2.06-3.81 2.06-6.49 1.81 4.66.95 5.85 3.81 3.29 5.84-4.86 3.86-7-9.83-7-9.83h-.51s-2.16 13.7-7 9.83c-2.56-2.03-1.37-4.89 3.29-5.84-2.68.25-4.74.25-6.49-1.81C2.5 9.6 2 3.14 2 2.26c0-4.5 3.9-3.13 6.3-1.35z",
  };

  const d = data[name] ?? "";
  return svg(d);
}
