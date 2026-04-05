"use client";

import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "logo_splash_shown";

export function LogoSplash() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(true);
  }, []);

  function handleEnded() {
    setFading(true);
  }

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
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src="/logo-animation-black.mp4"
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        style={{ maxWidth: "min(320px, 80vw)", maxHeight: "80vh" }}
      />
    </div>
  );
}
