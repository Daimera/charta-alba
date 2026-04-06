"use client";

import { useRef, useState } from "react";

export function AuthLogo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <div style={{ marginBottom: "24px", textAlign: "center" }}>
      {videoFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo-black.png"
          alt="Charta Alba"
          style={{ height: "56px", width: "auto", display: "inline-block" }}
        />
      ) : (
        /* eslint-disable-next-line jsx-a11y/media-has-caption */
        <video
          ref={videoRef}
          src="/logo-animation-black.mp4"
          autoPlay
          muted
          playsInline
          loop={false}
          onError={() => setVideoFailed(true)}
          style={{ height: "56px", width: "auto", display: "inline-block" }}
        />
      )}
    </div>
  );
}
