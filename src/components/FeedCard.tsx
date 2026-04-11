"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ActionBar } from "./ActionBar";
import { VideoEmbed } from "./VideoEmbed";
import { ReplicationBadge } from "./ReplicationBadge";
import { CitationGraph } from "./CitationGraph";
import { usePreferredLanguage } from "./LanguageSwitcher";
import type { FeedCardData } from "@/types";

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

interface FeedCardProps {
  card: FeedCardData;
  initialLiked: boolean;
  initialBookmarked: boolean;
  initialRating: number | null;
  commentCount: number;
  onLike: () => void;
  onTagClick: (tag: string) => void;
  onOpenComments: () => void;
  onOpenAskAI: () => void;
  onOpenClaims: () => void;
  onOpenCollections: () => void;
  index: number;
}

export function FeedCard({
  card,
  initialLiked,
  initialBookmarked,
  initialRating,
  commentCount,
  onLike,
  onTagClick,
  onOpenComments,
  onOpenAskAI,
  onOpenClaims,
  onOpenCollections,
  index,
}: FeedCardProps) {
  const articleRef = useRef<HTMLElement>(null);
  const { data: session } = useSession();
  const [lang] = usePreferredLanguage();
  const [showAbstract, setShowAbstract] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<{
    headline: string; hook: string; body: string; tldr: string;
  } | null>(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    const cardLang = card.sourceLanguage ?? "en";
    if (lang === cardLang) { setTranslatedContent(null); return; }
    if (!session?.user) { setTranslatedContent(null); return; }

    let cancelled = false;
    setTranslating(true);
    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.id, language: lang }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d: { headline?: string; hook?: string; body?: string; tldr?: string } | null) => {
        if (cancelled) return;
        if (d?.headline) {
          setTranslatedContent({
            headline: d.headline,
            hook: d.hook ?? card.hook,
            body: d.body ?? card.body,
            tldr: d.tldr ?? card.tldr,
          });
        }
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setTranslating(false); });

    return () => { cancelled = true; };
  }, [lang, card.id, session?.user]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayHeadline = translatedContent?.headline ?? card.headline;
  const displayHook     = translatedContent?.hook     ?? card.hook;
  const displayBody     = translatedContent?.body     ?? card.body;
  const displayTldr     = translatedContent?.tldr     ?? card.tldr;

  const ytQuery = encodeURIComponent((card.paperTitle ?? card.headline).slice(0, 80));
  const ytUrl = `https://www.youtube.com/results?search_query=${ytQuery}`;

  return (
    <article
      ref={articleRef}
      data-index={index}
      className="relative w-full h-dvh flex-shrink-0 snap-start overflow-hidden bg-[#0a0a0a] flex flex-col"
    >
      {/* Gradient overlay at top (nav clearance) */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />
      {/* Right-side gradient for action bar readability */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/40 to-transparent pointer-events-none z-10" />

      {/* ── Main content column ── */}
      <div className="flex-1 flex flex-col min-h-0 pt-20 pb-0">

        {/* Scrollable section */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pr-16 pb-3">
          <div className="flex flex-col gap-3">

            {card.videoUrl && <VideoEmbed url={card.videoUrl} />}

            {/* Replication badge + ELI5 toggle */}
            <div className="flex items-center justify-between gap-2">
              <div>
                {card.replicationStatus && (
                  <ReplicationBadge status={card.replicationStatus} />
                )}
              </div>
              {card.eli5Summary && (
                <button
                  onClick={() => setShowAbstract(true)}
                  className="text-xs px-2.5 py-0.5 rounded-full border font-medium bg-white/8 text-white/45 border-white/12 hover:border-white/25 transition-colors"
                >
                  Simple
                </button>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {card.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagClick(tag)}
                  className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/8 text-white/50 hover:bg-white/15 hover:text-white/75 transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>

            {/* Headline */}
            <h2
              className="text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight"
              style={{ opacity: translating ? 0.5 : 1, transition: "opacity 0.2s" }}
            >
              {displayHeadline}
            </h2>

            {/* Hook */}
            <p
              className="text-white/75 text-base leading-relaxed"
              style={{ opacity: translating ? 0.5 : 1, transition: "opacity 0.2s" }}
            >
              {displayHook}
            </p>

            {/* Abstract button */}
            <button
              onClick={() => setShowAbstract(true)}
              className="flex items-center gap-2 text-sm text-white/45 hover:text-white/70 transition-colors text-left group"
              style={{ opacity: translating ? 0.5 : 1 }}
            >
              <span>Read full abstract</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 group-hover:translate-x-0.5 transition-transform">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            {/* Links row: arXiv + YouTube */}
            <div className="flex items-center gap-2">
              {card.arxivUrl ? (
                <a
                  href={card.arxivUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-400/80 hover:text-blue-300 transition-colors"
                >
                  Read paper on arXiv →
                </a>
              ) : (
                <span className="text-xs text-white/25">No arXiv link</span>
              )}
              <span className="text-white/15">·</span>
              <a
                href={ytUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-red-400/70 hover:text-red-400 transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-2.75 12 12 0 0 0-8.45 0A4.83 4.83 0 0 1 3.59 6.69 46.36 46.36 0 0 0 3 12a46.36 46.36 0 0 0 .59 5.31 4.83 4.83 0 0 1 3.77 2.75 12 12 0 0 0 8.45 0 4.83 4.83 0 0 1 3.77-2.75A46.36 46.36 0 0 0 21 12a46.36 46.36 0 0 0-.41-5.31z"/><polygon points="9.75,15.02 15.5,12 9.75,8.98" fill="white"/></svg>
                Related videos
              </a>
            </div>

            {/* Citation graph */}
            {card.citations && card.citations.length > 0 && (
              <CitationGraph citations={card.citations} />
            )}
          </div>
        </div>

        {/* ── Sticky bottom bar: Read paper → TL;DR → meta ── */}
        <div className="shrink-0 px-5 pr-16 pb-4 pt-3 border-t border-white/6">
          {/* TL;DR */}
          <div className="rounded-xl bg-white/5 border border-white/8 px-4 py-2.5 mb-3">
            <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-0.5">
              TL;DR
            </p>
            <p
              className="text-white/85 text-sm font-medium leading-snug"
              style={{ opacity: translating ? 0.5 : 1, transition: "opacity 0.2s" }}
            >
              {displayTldr}
            </p>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 text-white/30 text-xs">
            <span className="tabular-nums">{card.readingTimeSeconds}s read</span>
            {(card.publishedAt ?? card.createdAt) && (
              <span>· {timeAgo(card.publishedAt ?? card.createdAt)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <ActionBar
        cardId={card.id}
        initialLiked={initialLiked}
        initialLikeCount={card.likeCount}
        initialBookmarked={initialBookmarked}
        initialBookmarkCount={card.bookmarkCount ?? 0}
        initialRating={initialRating}
        commentCount={commentCount}
        onLike={onLike}
        onOpenComments={onOpenComments}
        onOpenAskAI={onOpenAskAI}
        onOpenClaims={onOpenClaims}
        onOpenCollections={onOpenCollections}
      />

      {/* Abstract modal */}
      {showAbstract && (
        <div
          className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex flex-col fade-in"
          onClick={() => setShowAbstract(false)}
        >
          <div
            className="flex-1 overflow-y-auto px-5 pt-16 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">Full Abstract</p>
              <button
                onClick={() => setShowAbstract(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <h2 className="text-white font-bold text-xl leading-snug mb-4">{displayHeadline}</h2>

            {card.eli5Summary && (
              <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 px-4 py-3 mb-4">
                <p className="text-violet-300/70 text-xs font-semibold uppercase tracking-widest mb-1">Simple explanation</p>
                <p className="text-violet-200/80 text-sm leading-relaxed">{card.eli5Summary}</p>
              </div>
            )}

            <p className="text-white/75 text-sm leading-relaxed mb-4">{displayBody}</p>

            {card.citations && card.citations.length > 0 && (
              <CitationGraph citations={card.citations} />
            )}

            {card.arxivUrl && (
              <a
                href={card.arxivUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/8 text-sm font-semibold text-blue-400 hover:bg-blue-500/18 hover:text-blue-300 transition-all mt-4"
              >
                Read full paper on arXiv
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15,3 21,3 21,9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
