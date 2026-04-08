"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "./LogoMark";

const SESSION_KEY = "logo_splash_shown";
const DISPLAY_MS = 2000;

export function LogoSplash() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(true);
    const t = setTimeout(() => setFading(true), DISPLAY_MS);
    return () => clearTimeout(t);
  }, []);

  function handleTransitionEnd() {
    if (fading) setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      onTransitionEnd={handleTransitionEnd}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.5s ease",
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <div style={{ animation: "logoReveal 1s cubic-bezier(0.16,1,0.3,1) forwards" }}>
        <LogoMark size={120} color="#89CFF0" showGlow={true} glowColor="rgba(137,207,240,0.5)" />
      </div>
    </div>
  );
}
