"use client";

import { useState, useEffect } from "react";

const REFRESH_DELAY_MS = 5 * 60 * 1000; // 5 minutes

export function RefreshBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), REFRESH_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.location.reload()}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2 rounded-full bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold shadow-xl transition-colors"
      style={{ animation: "toastIn 0.3s cubic-bezier(0.32,0.72,0,1) forwards" }}
    >
      New papers available — tap to refresh
    </button>
  );
}
