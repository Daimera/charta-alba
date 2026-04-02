"use client";

import type { TrendingTag } from "@/types";

interface TrendingTopicsProps {
  tags: TrendingTag[];
  activeTags: string[];
  onTagClick: (tag: string) => void;
}

export function TrendingTopics({ tags, activeTags, onTagClick }: TrendingTopicsProps) {
  if (tags.length === 0) return null;

  return (
    <>
      {/* Desktop: fixed right sidebar */}
      <div className="fixed right-4 top-20 w-52 z-30 hidden xl:flex flex-col gap-2 pointer-events-auto">
        <p className="text-white/25 text-xs font-semibold uppercase tracking-widest px-1">
          🔥 Trending this week
        </p>
        <div className="bg-black/60 backdrop-blur border border-white/8 rounded-2xl overflow-hidden">
          {tags.map((t, i) => (
            <button
              key={t.tag}
              onClick={() => onTagClick(t.tag)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-white/5 ${
                i < tags.length - 1 ? "border-b border-white/6" : ""
              } ${activeTags.includes(t.tag) ? "bg-white/8" : ""}`}
            >
              <span className="text-white/70 text-sm">#{t.tag}</span>
              <span className="text-white/30 text-xs tabular-nums">{t.count.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: horizontal strip above feed (overlays the card gradient) */}
      <div className="fixed top-14 left-0 right-0 z-39 xl:hidden flex items-center gap-1.5 px-4 py-1.5 overflow-x-auto hide-scrollbar pointer-events-none">
        <span className="shrink-0 text-white/30 text-xs font-medium pointer-events-none">🔥</span>
        {tags.map((t) => (
          <button
            key={t.tag}
            onClick={() => onTagClick(t.tag)}
            className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors pointer-events-auto ${
              activeTags.includes(t.tag)
                ? "bg-amber-400/20 text-amber-300 border-amber-400/30"
                : "bg-black/50 text-white/45 border-white/10 hover:border-amber-400/30 hover:text-amber-300/70"
            }`}
          >
            #{t.tag}
          </button>
        ))}
      </div>
    </>
  );
}
