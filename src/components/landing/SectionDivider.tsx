type DividerVariant = "wave" | "curve" | "tilt" | "layers" | "smooth";

interface SectionDividerProps {
  variant?: DividerVariant;
  /** Tailwind fill classes matching the NEXT section's background color */
  fillClass?: string;
  flip?: boolean;
}

/**
 * Renders an SVG divider between two sections.
 *
 * The `fillClass` should match the background color of the section BELOW
 * the divider so the transition blends seamlessly.
 */
export function SectionDivider({
  variant = "wave",
  fillClass = "fill-white dark:fill-slate-950",
  flip = false,
}: SectionDividerProps) {
  const transform = flip ? "scale(-1, 1)" : undefined;

  return (
    <div className="relative z-10 -mb-px h-16 w-full overflow-hidden sm:h-24 lg:h-28" aria-hidden>
      <svg
        className={`absolute bottom-0 h-full w-full ${fillClass}`}
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{ transform }}
      >
        {variant === "wave" && (
          <path d="M0,40 C180,100 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1380,20 1440,40 L1440,120 L0,120 Z" />
        )}
        {variant === "curve" && (
          <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,60 1440,60 L1440,120 L0,120 Z" />
        )}
        {variant === "tilt" && (
          <path d="M0,120 L1440,0 L1440,120 L0,120 Z" />
        )}
        {variant === "layers" && (
          <>
            <path
              d="M0,70 C240,110 480,50 720,70 C960,90 1200,50 1440,70 L1440,120 L0,120 Z"
              opacity="0.6"
            />
            <path d="M0,90 C360,60 720,110 1080,90 C1260,78 1380,82 1440,90 L1440,120 L0,120 Z" />
          </>
        )}
        {variant === "smooth" && (
          <path d="M0,80 Q360,0 720,80 T1440,80 L1440,120 L0,120 Z" />
        )}
      </svg>
    </div>
  );
}

/** Pre-defined fill classes matching the project's section backgrounds. */
export const fills = {
  /** Matches bg-background — used when the next section is white/slate-950 */
  background: "fill-white dark:fill-slate-950",
  /** Matches bg-secondary/40 and dark:bg-[#0b1426] — Services, Gallery, FAQ */
  secondary: "fill-slate-50 dark:fill-[#0b1426]",
  /** Matches bg-[#0F172A] — Hero, Stats dark sections */
  dark: "fill-[#0F172A]",
} as const;
