"use client";

export type LogoTier = "basic" | "pro" | "diamond";

interface LogoMarkProps {
  size?: number;
  tier?: LogoTier;
  showGlow?: boolean;
  glowColor?: string;
  color?: string; // kept for call-site compat — ignored
}

const TIER_PNG: Record<LogoTier, string> = {
  basic:   "/logo-blue.png",
  pro:     "/logo-gold.png",
  diamond: "/logo-silver.png",
};

export function LogoMark({
  size = 36,
  tier,
}: LogoMarkProps) {
  const resolvedTier = tier ?? "basic";

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        id="logomark-img"
        src={TIER_PNG[resolvedTier]}
        alt="Charta Alba"
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          display: "block",
          padding: 0,
          margin: 0,
          background: "transparent",
          flexShrink: 0,
        }}
      />
    </div>
  );
}
