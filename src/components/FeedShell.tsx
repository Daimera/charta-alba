"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  Suspense,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FeedCard } from "./FeedCard";
import { ProgressDots } from "./ProgressDots";
import { CommentsDrawer } from "./CommentsDrawer";
import { AskAiDrawer } from "./AskAiDrawer";
import { ClaimsModal } from "./ClaimsModal";
import { CollectionsModal } from "./CollectionsModal";
import { LogoMark } from "./LogoMark";
import { PersonalizationToast } from "./PersonalizationToast";
import { RefreshBanner } from "./RefreshBanner";
import type { FeedCardData, TrendingTag } from "@/types";

interface FeedShellProps {
  cards: FeedCardData[];
  initialLikedIds: string[];
  initialBookmarkedIds: string[];
  trendingTags: TrendingTag[];
  loggedIn?: boolean;
}

const WALL_LIMIT = 2;

type DrawerState =
  | { type: "comments"; cardId: string }
  | { type: "ask-ai"; cardId: string; headline: string }
  | { type: "claims"; cardId: string; paperId: string; paperTitle: string | null }
  | { type: "collections"; cardId: string };

const TOAST_TRIGGER = 5;

function FeedShellInner({ cards, initialLikedIds, initialBookmarkedIds, loggedIn = true }: FeedShellProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [totalLikes, setTotalLikes] = useState(0);
  const [showToast, setShowToast] = useState(false);
  // Track comment counts locally so posting a comment increments without page reload
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const c of cards) m[c.id] = c.commentCount ?? 0;
    return m;
  });
  const toastShownRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter cards by search query
  const filteredCards = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return cards;
    return cards.filter((c) =>
      c.headline.toLowerCase().includes(q) ||
      c.hook.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [cards, searchQuery]);

  // IntersectionObserver to track current card
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const children = Array.from(container.querySelectorAll("[data-index]"));
    if (children.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!isNaN(idx)) setCurrentIndex(idx);
          }
        });
      },
      { root: container, threshold: 0.5 }
    );

    children.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [filteredCards.length]);

  const handleLike = useCallback(() => {
    setTotalLikes((prev) => {
      const next = prev + 1;
      if (next >= TOAST_TRIGGER && !toastShownRef.current) {
        toastShownRef.current = true;
        setShowToast(true);
      }
      return next;
    });
  }, []);

  const handleCommentPosted = useCallback((cardId: string) => {
    setCommentCounts((prev) => ({ ...prev, [cardId]: (prev[cardId] ?? 0) + 1 }));
  }, []);

  return (
    <>
      <RefreshBanner />

      {/* Snap-scroll feed container */}
      <div
        ref={containerRef}
        className="fixed inset-0 top-14 overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
      >
        {filteredCards.length === 0 ? (
          <div className="h-dvh flex items-center justify-center">
            <p className="text-white/30 text-sm">No cards match your filter.</p>
          </div>
        ) : (
          <>
            {(loggedIn ? filteredCards : filteredCards.slice(0, WALL_LIMIT)).map((card, i) => (
              <FeedCard
                key={card.id}
                card={card}
                index={i}
                initialLiked={initialLikedIds.includes(card.id)}
                initialBookmarked={initialBookmarkedIds.includes(card.id)}
                initialRating={null}
                commentCount={commentCounts[card.id] ?? 0}
                onLike={handleLike}
                onTagClick={() => {/* tags removed from feed filter */}}
                onOpenComments={() => setDrawer({ type: "comments", cardId: card.id })}
                onOpenAskAI={() =>
                  setDrawer({ type: "ask-ai", cardId: card.id, headline: card.headline })
                }
                onOpenClaims={() =>
                  setDrawer({
                    type: "claims",
                    cardId: card.id,
                    paperId: card.paperId,
                    paperTitle: card.paperTitle ?? null,
                  })
                }
                onOpenCollections={() =>
                  setDrawer({ type: "collections", cardId: card.id })
                }
              />
            ))}
            {!loggedIn && (
              <div className="h-dvh snap-start snap-always flex items-end justify-center relative bg-black">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/70 to-black pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center gap-4 px-6 pb-16 text-center w-full max-w-xs mx-auto">
                  <LogoMark size={52} color="#89CFF0" showGlow={true} />
                  <h2 className="text-xl font-bold text-white leading-snug">
                    Don&apos;t miss what&apos;s happening
                  </h2>
                  <p className="text-white/55 text-sm">
                    Join Charta Alba to follow AI research and stay ahead.
                  </p>
                  <Link
                    href="/auth/register"
                    className="w-full py-2.5 rounded-full text-sm font-semibold text-black transition-opacity hover:opacity-90"
                    style={{ background: "#89CFF0" }}
                  >
                    Create account
                  </Link>
                  <Link
                    href="/auth/signin"
                    className="w-full py-2.5 rounded-full text-sm font-medium text-white border border-white/30 hover:border-white/50 transition-colors"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ProgressDots total={filteredCards.length} current={currentIndex} />

      {/* Drawers & modals */}
      {drawer?.type === "comments" && (
        <CommentsDrawer
          cardId={drawer.cardId}
          onClose={() => setDrawer(null)}
          onCommentPosted={() => handleCommentPosted(drawer.cardId)}
        />
      )}
      {drawer?.type === "ask-ai" && (
        <AskAiDrawer
          cardId={drawer.cardId}
          headline={drawer.headline}
          onClose={() => setDrawer(null)}
        />
      )}
      {drawer?.type === "claims" && (
        <ClaimsModal
          cardId={drawer.cardId}
          paperId={drawer.paperId}
          paperTitle={drawer.paperTitle}
          onClose={() => setDrawer(null)}
        />
      )}
      {drawer?.type === "collections" && (
        <CollectionsModal
          cardId={drawer.cardId}
          onClose={() => setDrawer(null)}
        />
      )}

      {showToast && (
        <PersonalizationToast onClose={() => setShowToast(false)} />
      )}
    </>
  );
}

// Suspense boundary required by useSearchParams
export function FeedShell(props: FeedShellProps) {
  return (
    <Suspense fallback={null}>
      <FeedShellInner {...props} />
    </Suspense>
  );
}
