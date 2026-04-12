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

function CardModal({
  rows,
  index,
  onClose,
  onUnsave,
  onNav,
}: {
  rows: SavedRow[];
  index: number;
  onClose: () => void;
  onUnsave: (cardId: string) => void;
  onNav: (newIndex: number) => void;
}) {
  const row = rows[index];
  if (!row) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      <div
        className="flex-1 overflow-y-auto px-5 pt-16 pb-8 max-w-2xl mx-auto w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation bar */}
        <div className="flex items-center justify-between gap-3 mb-5 px-1">
          <button
            onClick={() => onNav(index - 1)}
            disabled={index === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/12 text-xs text-white/55 hover:bg-white/8 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            Prev
          </button>

          <button
            onClick={() => { onUnsave(row.cardId); onNav(Math.min(index, rows.length - 2)); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/12 text-xs text-white/55 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/25 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              <line x1="4" y1="4" x2="20" y2="20" />
            </svg>
            Unsave
          </button>

          <button
            onClick={() => onNav(index + 1)}
            disabled={index === rows.length - 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/12 text-xs text-white/55 hover:bg-white/8 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        {/* Paper count */}
        <p className="text-white/25 text-xs text-center mb-5">{index + 1} of {rows.length}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {row.tags.map((tag) => (
            <span key={tag} className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/8 text-white/50">#{tag}</span>
          ))}
        </div>

        {/* Headline */}
        <h2 className="text-2xl font-bold text-white leading-tight tracking-tight mb-4">{row.headline}</h2>

        {/* Hook */}
        <p className="text-white/75 text-base leading-relaxed mb-6">{row.hook}</p>

        {/* TL;DR placeholder */}
        <div className="rounded-xl bg-white/5 border border-white/8 px-4 py-2.5 mb-4">
          <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-0.5">Saved</p>
          <p className="text-white/60 text-sm">{timeAgo(row.savedAt)}</p>
        </div>

        {/* Links */}
        <div className="flex items-center gap-3 mt-4">
          <Link
            href={`/paper/${row.cardId}`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-all"
            onClick={onClose}
          >
            View card
          </Link>
          {row.arxivUrl && (
            <a
              href={row.arxivUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/8 text-sm font-semibold text-blue-400 hover:bg-blue-500/18 hover:text-blue-300 transition-all"
            >
              Read on arXiv →
            </a>
          )}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        aria-label="Close"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export function SavedList({ initialRows }: { initialRows: SavedRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [fadingOut, setFadingOut] = useState<Set<string>>(new Set());
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const inFlight = useRef<Set<string>>(new Set());

  async function handleUnsave(cardId: string) {
    if (inFlight.current.has(cardId)) return;
    inFlight.current.add(cardId);

    setFadingOut((s) => new Set(s).add(cardId));

    let ok = false;
    try {
      const res = await fetch(`/api/cards/${cardId}/bookmark`, { method: "DELETE" });
      ok = res.ok;
    } catch {
      ok = false;
    }

    if (ok) {
      setTimeout(() => {
        setRows((prev) => prev.filter((r) => r.cardId !== cardId));
        setFadingOut((s) => { const n = new Set(s); n.delete(cardId); return n; });
        inFlight.current.delete(cardId);
      }, 220);
    } else {
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
    <>
      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div
            key={row.cardId}
            style={{
              opacity: fadingOut.has(row.cardId) ? 0 : 1,
              transition: "opacity 0.2s ease",
              pointerEvents: fadingOut.has(row.cardId) ? "none" : undefined,
            }}
            className="p-4 rounded-2xl bg-white/4 border border-white/8 hover:bg-white/6 transition-colors cursor-pointer"
            onClick={() => setOpenIndex(idx)}
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
              <div className="flex flex-col gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
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

      {openIndex !== null && openIndex < rows.length && (
        <CardModal
          rows={rows}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onUnsave={(cardId) => {
            handleUnsave(cardId);
            if (rows.length <= 1) setOpenIndex(null);
          }}
          onNav={(newIdx) => {
            if (newIdx < 0 || newIdx >= rows.length) return;
            setOpenIndex(newIdx);
          }}
        />
      )}
    </>
  );
}
