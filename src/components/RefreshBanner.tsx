"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const REFRESH_DELAY_MS = 5 * 60 * 1000; // 5 minutes

export function RefreshBanner() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), REFRESH_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    router.refresh();
    // Hide banner after refresh (router.refresh() is synchronous in terms of triggering)
    setTimeout(() => { setShow(false); setRefreshing(false); }, 1000);
  }, [router]);

  // R key shortcut (desktop)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "r" || e.key === "R") doRefresh();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doRefresh]);

  if (!show) return null;

  return (
    <button
      onClick={doRefresh}
      disabled={refreshing}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2 rounded-full bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white text-sm font-semibold shadow-xl transition-colors"
      style={{ animation: "toastIn 0.3s cubic-bezier(0.32,0.72,0,1) forwards" }}
    >
      {refreshing ? "Refreshing…" : "New papers available — tap to refresh"}
    </button>
  );
}
