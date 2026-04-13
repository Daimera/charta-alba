"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

interface SavedNavProps {
  cardId: string;
}

export function SavedNav({ cardId }: SavedNavProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [unsaving, setUnsaving] = useState(false);
  const [unsaved, setUnsaved] = useState(false);

  const src = searchParams.get("src");
  const list = searchParams.get("list");
  const idxParam = searchParams.get("idx");

  if (src !== "saved" || !list) return null;

  const ids = decodeURIComponent(list).split(",").filter(Boolean);
  const idx = parseInt(idxParam ?? "0", 10);
  const total = ids.length;

  function goTo(newIdx: number) {
    const targetId = ids[newIdx];
    if (!targetId) return;
    const params = new URLSearchParams({
      src: "saved",
      idx: String(newIdx),
      list: list!,
    });
    router.push(`/paper/${targetId}?${params.toString()}`);
  }

  async function handleUnsave() {
    setUnsaving(true);
    try {
      const res = await fetch(`/api/cards/${cardId}/bookmark`, { method: "DELETE" });
      if (res.ok) {
        setUnsaved(true);
        // Remove this ID from list and navigate to next/prev
        const newIds = ids.filter((id) => id !== cardId);
        if (newIds.length === 0) {
          router.push("/saved");
          return;
        }
        const newIdx = Math.min(idx, newIds.length - 1);
        const targetId = newIds[newIdx];
        const params = new URLSearchParams({
          src: "saved",
          idx: String(newIdx),
          list: encodeURIComponent(newIds.join(",")),
        });
        router.push(`/paper/${targetId}?${params.toString()}`);
      }
    } finally {
      setUnsaving(false);
    }
  }

  return (
    <div className="sticky top-14 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/8 px-4 py-2.5">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        {/* Back to saved */}
        <a
          href="/saved"
          className="text-white/35 hover:text-white text-xs transition-colors flex items-center gap-1"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Saved
        </a>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goTo(idx - 1)}
            disabled={idx <= 0}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/12 text-xs text-white/45 hover:bg-white/8 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            Prev
          </button>

          <span className="text-white/30 text-xs tabular-nums">{idx + 1} of {total}</span>

          <button
            onClick={() => goTo(idx + 1)}
            disabled={idx >= total - 1}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/12 text-xs text-white/45 hover:bg-white/8 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        {/* Unsave */}
        <button
          onClick={handleUnsave}
          disabled={unsaving || unsaved}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/12 text-xs text-white/40 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/25 disabled:opacity-40 transition-colors"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            {!unsaved && <line x1="4" y1="4" x2="20" y2="20" />}
          </svg>
          {unsaved ? "Unsaved" : unsaving ? "…" : "Unsave"}
        </button>
      </div>
    </div>
  );
}
