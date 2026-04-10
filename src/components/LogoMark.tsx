"use client";

import { useState, useEffect } from "react";

export type LogoTier = "basic" | "pro" | "diamond";

interface LogoMarkProps {
  size?: number;
  tier?: LogoTier;
  showGlow?: boolean;
  glowColor?: string;
  color?: string; // kept for call-site compat — ignored
}

// Per-tier foreground color (dark mode)
const TIER_COLOR_DARK: Record<LogoTier, string> = {
  basic:   "#89CFF0",
  pro:     "#FFD700",
  diamond: "#B9F2FF",
};

// Light mode: near-black
const TIER_COLOR_LIGHT: Record<LogoTier, string> = {
  basic:   "#111111",
  pro:     "#8B6914",
  diamond: "#2a4a5a",
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

function isLightTheme() {
  if (typeof document === "undefined") return false;
  const t = document.documentElement.getAttribute("data-theme");
  if (t === "light") return true;
  if (t === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches;
  }
  return false;
}

export function LogoMark({
  size = 36,
  tier,
  showGlow = true,
  glowColor,
}: LogoMarkProps) {
  const resolvedTier = tier ?? "basic";
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(isLightTheme());
    const obs = new MutationObserver(() => setLight(isLightTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  const color = light ? TIER_COLOR_LIGHT[resolvedTier] : TIER_COLOR_DARK[resolvedTier];

  const hoverFilter = glowColor
    ? `drop-shadow(0 0 10px ${glowColor}) brightness(1.2)`
    : TIER_GLOW_HOVER[resolvedTier];
  const baseFilter = showGlow && !light
    ? (glowColor ? `drop-shadow(0 0 4px ${glowColor})` : TIER_GLOW_BASE[resolvedTier])
    : "none";

  return (
    <svg
      viewBox="0 0 100 105"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="lm-hover"
      aria-label="Charta Alba"
      role="img"
      style={{
        display: "block",
        flexShrink: 0,
        color,
        filter: baseFilter,
        ["--lm-hover-filter" as string]: hoverFilter,
      }}
    >
      {/*
        Geometric star/shield silhouette with a diamond cutout.
        fillRule="evenodd" creates the inner diamond hole.
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
