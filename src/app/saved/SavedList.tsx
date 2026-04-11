"use client";

import { useState, useRef } from "react";
import Link from "next/link";

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return m <= 1 ? "just now" : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

interface SavedRow {
  cardId: string;
  headline: string;
  hook: string;
  tags: string[];
  readingTimeSeconds: number;
  arxivUrl: string | null;
  savedAt: string | null;
}

export function SavedList({ initialRows }: { initialRows: SavedRow[] }) {
  const [rows, setRows] = useState(initialRows);
  // Track which cards are fading out (opacity 0) before DOM removal
  const [fadingOut, setFadingOut] = useState<Set<string>>(new Set());
  const inFlight = useRef<Set<string>>(new Set());

  async function handleUnsave(cardId: string) {
    if (inFlight.current.has(cardId)) return;
    inFlight.current.add(cardId);

    // 1. Fade the row out visually (preserves height so no scroll jump)
    setFadingOut((s) => new Set(s).add(cardId));

    // 2. Fire the API in parallel
    let ok = false;
    try {
      const res = await fetch(`/api/cards/${cardId}/bookmark`, { method: "DELETE" });
      ok = res.ok;
    } catch {
      ok = false;
    }

    if (ok) {
      // 3. Remove from DOM after the fade transition (200ms)
      setTimeout(() => {
        setRows((prev) => prev.filter((r) => r.cardId !== cardId));
        setFadingOut((s) => { const n = new Set(s); n.delete(cardId); return n; });
        inFlight.current.delete(cardId);
      }, 220);
    } else {
      // Revert fade on failure
      setFadingOut((s) => { const n = new Set(s); n.delete(cardId); return n; });
      inFlight.current.delete(cardId);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/25">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="text-white/30 text-sm">Nothing saved yet.</p>
        <Link href="/" className="inline-block px-4 py-2 rounded-lg bg-white/8 border border-white/10 text-sm text-white/60 hover:bg-white/12 transition-colors">
          Browse the feed
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div
          key={row.cardId}
          style={{
            opacity: fadingOut.has(row.cardId) ? 0 : 1,
            transition: "opacity 0.2s ease",
            // Keep height during fade so items below don't jump up
            pointerEvents: fadingOut.has(row.cardId) ? "none" : undefined,
          }}
          className="p-4 rounded-2xl bg-white/4 border border-white/8 hover:bg-white/6 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-snug mb-1 line-clamp-2">{row.headline}</p>
              <p className="text-white/50 text-xs leading-relaxed line-clamp-2 mb-2">{row.hook}</p>
              {row.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {row.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-xs text-white/35 bg-white/5 px-2 py-0.5 rounded-full">#{tag}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 text-white/25 text-xs">
                <span>{row.readingTimeSeconds}s read</span>
                {row.savedAt && <span>· saved {timeAgo(row.savedAt)}</span>}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Link
                href={`/paper/${row.cardId}`}
                className="px-3 py-1.5 rounded-lg bg-white/8 border border-white/10 text-xs text-white/60 hover:bg-white/12 hover:text-white/80 transition-colors text-center"
              >
                View
              </Link>
              {row.arxivUrl && (
                <a
                  href={row.arxivUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 hover:bg-blue-500/15 transition-colors text-center"
                >
                  Paper ↗
                </a>
              )}
              {/* Unsave button */}
              <button
                onClick={() => handleUnsave(row.cardId)}
                aria-label="Remove from saved"
                className="px-3 py-1.5 rounded-lg bg-white/4 border border-white/8 text-xs text-white/35 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/25 transition-colors text-center"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  <line x1="4" y1="4" x2="20" y2="20" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
