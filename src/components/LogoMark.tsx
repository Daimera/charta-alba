export type LogoTier = "basic" | "pro" | "diamond";

interface LogoMarkProps {
  size?: number;
  tier?: LogoTier;
  showGlow?: boolean;
  glowColor?: string;
  color?: string; // kept for call-site compat — ignored, PNGs are pre-colored
}

const TIER_SRC: Record<LogoTier, string> = {
  basic:   "/logo-blue.png",
  pro:     "/logo-gold.png",
  diamond: "/logo-silver.png",
};

const TIER_GLOW_HOVER: Record<LogoTier, string> = {
  basic:   "drop-shadow(0 0 10px rgba(137,207,240,0.9)) brightness(1.2)",
  pro:     "drop-shadow(0 0 10px rgba(255,215,0,0.9)) brightness(1.2)",
  diamond: "drop-shadow(0 0 10px rgba(185,242,255,0.9)) brightness(1.2)",
};
const TIER_GLOW_BASE: Record<LogoTier, string> = {
  basic:   "drop-shadow(0 0 4px rgba(137,207,240,0.45))",
  pro:     "drop-shadow(0 0 4px rgba(255,215,0,0.45))",
  diamond: "drop-shadow(0 0 4px rgba(185,242,255,0.45))",
};

// Unique class prefix — avoids conflicts with any global CSS
const CLS = "lm-hover";

export function LogoMark({
  size = 36,
  tier,
  showGlow = true,
  glowColor,
}: LogoMarkProps) {
  const resolvedTier = tier ?? "basic";
  const src = TIER_SRC[resolvedTier];

  const hoverFilter = glowColor
    ? `drop-shadow(0 0 10px ${glowColor}) brightness(1.2)`
    : TIER_GLOW_HOVER[resolvedTier];
  const baseFilter = showGlow
    ? (glowColor ? `drop-shadow(0 0 4px ${glowColor})` : TIER_GLOW_BASE[resolvedTier])
    : "none";

  return (
    <>
      {/* Scoped style tag — bypasses CSS module purging and PostCSS transforms */}
      <style>{`
        .${CLS} {
          transition: transform 0.2s ease, filter 0.2s ease;
          cursor: pointer;
          display: block;
          background: none !important;
          background-color: transparent !important;
        }
        .${CLS}:hover {
          transform: scale(1.1);
          filter: ${hoverFilter} !important;
        }
      `}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Charta Alba"
        width={size}
        height={size}
        className={CLS}
        style={{
          width: size,
          height: size,
          display: "block",
          background: "none",
          backgroundColor: "transparent",
          flexShrink: 0,
          filter: baseFilter,
        }}
      />
    </>
  );
}
