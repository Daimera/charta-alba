"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const BADGE_CONFIG: Record<string, { img: string; video: string; label: string } | null> = {
  free: null,
  basic:   { img: "/logo-blue.png",    video: "/logo-animation-blue.mp4",    label: "Standard Member" },
  pro:     { img: "/logo-gold.png",    video: "/logo-animation-gold.mp4",    label: "Pro Member" },
  diamond: { img: "/logo-diamond.png", video: "/logo-animation-diamond.mp4", label: "Diamond Member" },
};

interface TierBadgeProps {
  tier: string | null | undefined;
}

export function TierBadge({ tier }: TierBadgeProps) {
  const config = tier ? BADGE_CONFIG[tier] : null;
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!config) return null;

  function handleMouseEnter() {
    setHovered(true);
    videoRef.current?.play().catch(() => undefined);
  }

  function handleMouseLeave() {
    setHovered(false);
    const v = videoRef.current;
    if (v) { v.pause(); v.currentTime = 0; }
  }

  return (
    <span
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
    >
      {/* Static badge image */}
      <Image
        src={config.img}
        alt={config.label}
        title={config.label}
        width={40}
        height={20}
        style={{ height: "20px", width: "auto", cursor: "default" }}
      />

      {/* Hover video tooltip */}
      {hovered && (
        <span
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            background: "#111",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "6px",
            padding: "4px",
            pointerEvents: "none",
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            src={config.video}
            muted
            playsInline
            autoPlay
            style={{ width: "32px", height: "32px", display: "block" }}
          />
        </span>
      )}
    </span>
  );
}
