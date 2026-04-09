"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { LogoMark } from "@/components/LogoMark";
import type { FeedCardData } from "@/types";

const WALL_LIMIT = 5;

const WINDOWS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "all", label: "All Time" },
] as const;

type Window = (typeof WINDOWS)[number]["key"];

function RankRow({ card, rank }: { card: FeedCardData; rank: number }) {
  return (
    <Link href={`/paper/${card.id}`} className="flex items-start gap-4 p-4 rounded-2xl bg-white/4 hover:bg-white/7 border border-white/6 hover:border-white/12 transition-all group">
      {/* Rank */}
      <div className="w-8 shrink-0 text-center">
        <span
          className={`text-lg font-bold tabular-nums ${
            rank === 1
              ? "text-yellow-400"
              : rank === 2
              ? "text-white/60"
              : rank === 3
              ? "text-amber-600"
              : "text-white/25"
          }`}
        >
          {rank}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {card.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-0.5 rounded-full bg-white/6 text-white/40"
            >
              #{t}
            </span>
          ))}
        </div>
        <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 group-hover:text-white/90 transition-colors">
          {card.headline}
        </h3>
        <p className="text-white/40 text-xs mt-1 line-clamp-1">{card.hook}</p>
      </div>

      {/* Stats */}
      <div className="shrink-0 flex flex-col items-end gap-1">
        <div className="flex items-center gap-1 text-white/60">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className="text-sm font-semibold tabular-nums text-white/70">
            {card.likeCount}
          </span>
        </div>
        <span className="text-white/25 text-xs tabular-nums">{card.readingTimeSeconds}s</span>
      </div>
    </Link>
  );
}

export default function TopPage() {
  const { data: session } = useSession();
  const loggedIn = !!session?.user;
  const [window, setWindow] = useState<Window>("today");
  const [cards, setCards] = useState<FeedCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/top?window=${window}`)
      .then((r) => r.json())
      .then((d) => setCards(d.cards ?? []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, [window]);

  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold tracking-tight">Trending</h1>
          <p className="text-white/40 text-sm mt-1">Most liked papers, ranked by community</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6">
          {WINDOWS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setWindow(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                window === key
                  ? "bg-white text-black"
                  : "text-white/50 hover:text-white/75"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/30 text-sm">No cards yet for this period.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {(loggedIn ? cards : cards.slice(0, WALL_LIMIT)).map((card, i) => (
                <RankRow key={card.id} card={card} rank={i + 1} />
              ))}
            </div>
            {!loggedIn && cards.length > WALL_LIMIT && (
              <div className="mt-8 flex flex-col items-center gap-4 py-10 px-6 text-center rounded-2xl bg-white/3 border border-white/8">
                <LogoMark size={44} color="#89CFF0" showGlow={true} />
                <h2 className="text-lg font-bold text-white">See the full rankings</h2>
                <p className="text-white/50 text-sm">Create a free account to see all trending papers.</p>
                <Link
                  href="/auth/register"
                  className="w-full py-2.5 rounded-full text-sm font-semibold text-black transition-opacity hover:opacity-90"
                  style={{ background: "#89CFF0" }}
                >
                  Create account
                </Link>
                <Link href="/auth/signin" className="text-white/50 text-sm hover:text-white transition-colors">
                  Sign in
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
