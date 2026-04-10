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

// Light-mode uses the black silhouette; dark uses the blue logo
const LIGHT_SRC: Record<LogoTier, string> = {
  basic:   "/logo-black.png",
  pro:     "/logo-gold.png",
  diamond: "/logo-silver.png",
};
const DARK_SRC: Record<LogoTier, string> = {
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

function isLightTheme() {
  if (typeof document === "undefined") return false;
  const t = document.documentElement.getAttribute("data-theme");
  if (t === "light") return true;
  if (t === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches;
  }
  return false;
}

const CLS = "lm-hover";

export function LogoMark({
  size = 36,
  tier,
  showGlow = true,
  glowColor,
}: LogoMarkProps) {
  const resolvedTier = tier ?? "basic";
  const [light, setLight] = useState(false);

  // Detect theme on mount and watch for changes via MutationObserver
  useEffect(() => {
    setLight(isLightTheme());

    const obs = new MutationObserver(() => setLight(isLightTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  const src = light ? LIGHT_SRC[resolvedTier] : DARK_SRC[resolvedTier];

  const hoverFilter = glowColor
    ? `drop-shadow(0 0 10px ${glowColor}) brightness(1.2)`
    : TIER_GLOW_HOVER[resolvedTier];
  const baseFilter = showGlow
    ? (glowColor ? `drop-shadow(0 0 4px ${glowColor})` : TIER_GLOW_BASE[resolvedTier])
    : "none";

  // eslint-disable-next-line @next/next/no-img-element
  return (
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
        filter: light ? "none" : baseFilter,
        ["--lm-hover-filter" as string]: hoverFilter,
      }}
    />
  );
}
