export type LogoTier = "basic" | "pro" | "diamond";

interface LogoMarkProps {
  size?: number;
  tier?: LogoTier;
  showGlow?: boolean;
  glowColor?: string;
  // Kept for call-site backward compat — ignored (PNGs are pre-colored)
  color?: string;
}

const TIER_SRC: Record<LogoTier, string> = {
  basic:   "/logo-blue.png",
  pro:     "/logo-gold.png",
  diamond: "/logo-silver.png",
};

const TIER_GLOW_HOVER: Record<string, string> = {
  basic:   "drop-shadow(0 0 8px rgba(137,207,240,0.9))",
  pro:     "drop-shadow(0 0 8px rgba(255,215,0,0.9))",
  diamond: "drop-shadow(0 0 8px rgba(185,242,255,0.9))",
};
const TIER_GLOW_BASE: Record<string, string> = {
  basic:   "drop-shadow(0 0 4px rgba(137,207,240,0.4))",
  pro:     "drop-shadow(0 0 4px rgba(255,215,0,0.4))",
  diamond: "drop-shadow(0 0 4px rgba(185,242,255,0.4))",
};

export function LogoMark({
  size = 36,
  tier,
  showGlow = true,
  glowColor,
}: LogoMarkProps) {
  const src = tier ? TIER_SRC[tier] : "/logo-blue.png";
  const resolvedTier = tier ?? "basic";

  const hoverFilter = glowColor
    ? `drop-shadow(0 0 8px ${glowColor})`
    : TIER_GLOW_HOVER[resolvedTier];
  const baseFilter = showGlow
    ? (glowColor ? `drop-shadow(0 0 4px ${glowColor})` : TIER_GLOW_BASE[resolvedTier])
    : "none";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Charta Alba"
      width={size}
      height={size}
      className="logomark-img"
      style={{
        width: size,
        height: size,
        background: "transparent",
        backgroundColor: "transparent",
        filter: baseFilter,
        // CSS var picked up by .logomark-img:hover in globals.css
        ["--logomark-hover-filter" as string]: hoverFilter,
      }}
    />
  );
}
