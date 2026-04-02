"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import { FeedCard } from "./FeedCard";
import { ProgressDots } from "./ProgressDots";
import { TagFilterBar } from "./TagFilterBar";
import { CommentsDrawer } from "./CommentsDrawer";
import { AskAiDrawer } from "./AskAiDrawer";
import { ClaimsModal } from "./ClaimsModal";
import { CollectionsModal } from "./CollectionsModal";
import { TrendingTopics } from "./TrendingTopics";
import { PersonalizationToast } from "./PersonalizationToast";
import type { FeedCardData, TrendingTag } from "@/types";

interface FeedShellProps {
  cards: FeedCardData[];
  initialLikedIds: string[];
  initialBookmarkedIds: string[];
  trendingTags: TrendingTag[];
}

type DrawerState =
  | { type: "comments"; cardId: string }
  | { type: "ask-ai"; cardId: string; headline: string }
  | { type: "claims"; cardId: string; paperId: string; paperTitle: string | null }
  | { type: "collections"; cardId: string };

const TOAST_TRIGGER = 5;
const STORAGE_KEY = "ca_tag_filter";

function FeedShellInner({ cards, initialLikedIds, initialBookmarkedIds, trendingTags }: FeedShellProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";

  const [activeTagFilter, setActiveTagFilter] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
      return [];
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [totalLikes, setTotalLikes] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const toastShownRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Persist tag filter to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeTagFilter));
    } catch {
      // ignore
    }
  }, [activeTagFilter]);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [cards]);

  // Filter cards by search query + active tags
  const filteredCards = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return cards.filter((c) => {
      const matchesSearch =
        !q ||
        c.headline.toLowerCase().includes(q) ||
        c.hook.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q));
      const matchesTags =
        activeTagFilter.length === 0 ||
        c.tags.some((t) => activeTagFilter.includes(t));
      return matchesSearch && matchesTags;
    });
  }, [cards, searchQuery, activeTagFilter]);

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

  const handleTagClick = useCallback(
    (tag: string) => {
      setActiveTagFilter((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      );
    },
    []
  );

  return (
    <>
      <TagFilterBar
        tags={allTags}
        active={activeTagFilter}
        onChange={setActiveTagFilter}
      />

      {/* Trending topics — desktop sidebar + mobile strip */}
      <TrendingTopics
        tags={trendingTags}
        activeTags={activeTagFilter}
        onTagClick={handleTagClick}
      />

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
          filteredCards.map((card, i) => (
            <FeedCard
              key={card.id}
              card={card}
              index={i}
              initialLiked={initialLikedIds.includes(card.id)}
              initialBookmarked={initialBookmarkedIds.includes(card.id)}
              initialRating={null}
              commentCount={0}
              onLike={handleLike}
              onTagClick={handleTagClick}
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
          ))
        )}
      </div>

      <ProgressDots total={filteredCards.length} current={currentIndex} />

      {/* Drawers & modals */}
      {drawer?.type === "comments" && (
        <CommentsDrawer
          cardId={drawer.cardId}
          onClose={() => setDrawer(null)}
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
