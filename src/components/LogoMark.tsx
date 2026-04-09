import styles from "./LogoMark.module.css";

export type LogoTier = "basic" | "pro" | "diamond";

interface LogoMarkProps {
  size?: number;
  tier?: LogoTier;
  showGlow?: boolean;
  glowColor?: string;
  color?: string; // kept for call-site compat — drives the SVG fill color
}

const TIER_COLOR: Record<LogoTier, string> = {
  basic:   "#89CFF0",   // baby blue
  pro:     "#FFD700",   // gold
  diamond: "#B0ECF5",   // silver-blue
};

const TIER_GLOW_HOVER: Record<LogoTier, string> = {
  basic:   "drop-shadow(0 0 8px rgba(137,207,240,0.9))",
  pro:     "drop-shadow(0 0 8px rgba(255,215,0,0.9))",
  diamond: "drop-shadow(0 0 8px rgba(185,242,255,0.9))",
};
const TIER_GLOW_BASE: Record<LogoTier, string> = {
  basic:   "drop-shadow(0 0 4px rgba(137,207,240,0.4))",
  pro:     "drop-shadow(0 0 4px rgba(255,215,0,0.4))",
  diamond: "drop-shadow(0 0 4px rgba(185,242,255,0.4))",
};

/**
 * Inline SVG tracing of the Charta Alba logomark — a three-pronged upward
 * arrow/trident shape with two scroll elements at the base.
 * Uses fill="currentColor" so the colour is driven by the `color` CSS property.
 * Transparent background is guaranteed — no PNG, no wrapper background.
 */
export function LogoMark({
  size = 36,
  tier,
  showGlow = true,
  glowColor,
  color,
}: LogoMarkProps) {
  const resolvedTier = tier ?? "basic";

  // Explicit color prop > tier default
  const fillColor = color ?? TIER_COLOR[resolvedTier];

  const hoverFilter = glowColor
    ? `drop-shadow(0 0 8px ${glowColor})`
    : TIER_GLOW_HOVER[resolvedTier];
  const baseFilter = showGlow
    ? (glowColor ? `drop-shadow(0 0 4px ${glowColor})` : TIER_GLOW_BASE[resolvedTier])
    : "none";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 105"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.logo}
      style={{
        color: fillColor,
        filter: baseFilter,
        ["--logomark-hover-filter" as string]: hoverFilter,
        flexShrink: 0,
      }}
      aria-label="Charta Alba"
      role="img"
    >
      {/*
        Three-pronged arrow mark with scroll base — traced from the Charta Alba logo PNG.
        Outer shape: top apex → right wing tip → lower-right scroll → bottom centre →
        lower-left scroll → left wing tip → back to apex.
        Inner diamond hole cut with evenodd fill-rule.
      */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d="
          M50 2
          L62 26 L91 15 L79 44 L88 70
          C 83 82 71 88 61 80
          C 57 76 54 69 52 62
          L50 76
          L48 62
          C 46 69 43 76 39 80
          C 29 88 17 82 12 70
          L21 44 L9 15 L38 26
          Z
          M50 32 L62 50 L50 57 L38 50 Z
        "
      />
    </svg>
  );
}
