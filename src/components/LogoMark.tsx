"use client";

import { useState } from "react";

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

const TIER_GLOW_BASE: Record<string, string> = {
  pro:     "rgba(255,215,0,0.4)",
  diamond: "rgba(185,242,255,0.4)",
};
const TIER_GLOW_HOVER: Record<string, string> = {
  pro:     "rgba(255,215,0,0.9)",
  diamond: "rgba(185,242,255,0.9)",
};

export function LogoMark({
  size = 36,
  tier,
  showGlow = true,
  glowColor,
}: LogoMarkProps) {
  const [hovered, setHovered] = useState(false);

  const src = tier ? TIER_SRC[tier] : "/logo-blue.png";
  const glowPx   = Math.max(3, Math.round(size / 9));
  const hoverPx  = Math.max(6, Math.round(size / 5));
  const baseGlow  = glowColor ?? TIER_GLOW_BASE[tier ?? ""] ?? "rgba(137,207,240,0.4)";
  const hoverGlow = TIER_GLOW_HOVER[tier ?? ""] ?? "rgba(137,207,240,0.9)";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Charta Alba"
      width={size}
      height={size}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block",
        width: size,
        height: size,
        objectFit: "contain",
        background: "transparent",
        filter: hovered
          ? `drop-shadow(0 0 ${hoverPx}px ${hoverGlow})`
          : showGlow
          ? `drop-shadow(0 0 ${glowPx}px ${baseGlow})`
          : "none",
        transform: hovered ? "scale(1.08)" : "scale(1)",
        transition: "filter 0.2s ease, transform 0.2s ease",
      }}
    />
  );
}
