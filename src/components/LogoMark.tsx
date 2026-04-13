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

// Tier → mask image (PNG used as alpha mask)
const TIER_MASK: Record<LogoTier, string> = {
  basic:   "/logo-blue.png",
  pro:     "/logo-gold.png",
  diamond: "/logo-silver.png",
};

// Base color per tier (dark mode)
const TIER_COLOR: Record<LogoTier, string> = {
  basic:   "#89CFF0",
  pro:     "#FFD700",
  diamond: "#C0C0C0",
};

export function LogoMark({
  size = 36,
  tier,
}: LogoMarkProps) {
  const resolvedTier = tier ?? "basic";
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsLight(document.documentElement.getAttribute("data-theme") === "light");
    };
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  const maskUrl = `url(${TIER_MASK[resolvedTier]})`;
  const bgColor = isLight ? "#111111" : TIER_COLOR[resolvedTier];

  return (
    <div
      id="logomark-img"
      aria-label="Charta Alba"
      role="img"
      className="lm-hover"
      style={{
        width: size,
        height: size,
        display: "block",
        flexShrink: 0,
        WebkitMaskImage: maskUrl,
        maskImage: maskUrl,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        backgroundColor: bgColor,
        ["--lm-hover-filter" as string]: isLight
          ? "brightness(0.3)"
          : `drop-shadow(0 0 8px ${TIER_COLOR[resolvedTier]}cc) brightness(1.15)`,
      }}
    />
  );
}
