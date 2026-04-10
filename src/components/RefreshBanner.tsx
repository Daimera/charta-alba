"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { FeedCardData } from "@/types";

const FIRST_CHECK_MS = 3 * 60 * 1000; // first check after 3 minutes
const POLL_INTERVAL_MS = 60 * 1000;   // poll every 60 seconds after that

interface RefreshBannerProps {
  topCardId: string | null;
  onNewCards: (cards: FeedCardData[]) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function RefreshBanner({ topCardId, onNewCards, containerRef }: RefreshBannerProps) {
  const [newCards, setNewCards] = useState<FeedCardData[]>([]);
  const [animatingIn, setAnimatingIn] = useState(false);
  const latestTopId = useRef(topCardId);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { latestTopId.current = topCardId; }, [topCardId]);

  const check = useCallback(async () => {
    if (!latestTopId.current) return;
    try {
      const res = await fetch(`/api/feed?after=${latestTopId.current}`);
      if (!res.ok) return;
      const data = await res.json() as { cards: FeedCardData[]; count: number };
      if (data.count > 0) {
        setNewCards(data.cards);
        setAnimatingIn(true);
      }
    } catch {
      // Network error — silently ignore
    }
  }, []);

  // Start polling after 3 min, then every 60s
  useEffect(() => {
    const firstTimer = setTimeout(() => {
      check();
      pollRef.current = setInterval(check, POLL_INTERVAL_MS);
    }, FIRST_CHECK_MS);

    return () => {
      clearTimeout(firstTimer);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [check]);

  const handleClick = useCallback(() => {
    if (newCards.length === 0) return;
    // Prepend new cards
    onNewCards(newCards);
    setNewCards([]);
    setAnimatingIn(false);
    // Scroll to top smoothly
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [newCards, onNewCards, containerRef]);

  if (newCards.length === 0) return null;

  return (
    <button
      onClick={handleClick}
      aria-live="polite"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-[#89CFF0] text-black text-sm font-semibold shadow-xl hover:opacity-90 active:scale-95 transition-all"
      style={{
        animation: animatingIn ? "toastIn 0.35s cubic-bezier(0.32,0.72,0,1) forwards" : undefined,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="18,15 12,9 6,15" />
      </svg>
      {newCards.length} new paper{newCards.length !== 1 ? "s" : ""}
    </button>
  );
}
