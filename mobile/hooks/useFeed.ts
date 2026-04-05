import { useState, useCallback, useRef } from "react";
import { apiUrl } from "@/constants/api";

export interface FeedCard {
  id: string;
  headline: string;
  hook: string;
  body: string;
  tldr: string;
  tags: string[];
  likesCount: number;
  bookmarksCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  paper: {
    id: string;
    title: string;
    authors: string[];
    publishedAt: string;
  };
}

export function useFeed() {
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMoreRef.current) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "10" });
      if (cursorRef.current) params.set("cursor", cursorRef.current);
      const res = await fetch(apiUrl(`/api/feed?${params}`));
      if (!res.ok) return;
      const data = await res.json() as { cards: FeedCard[]; nextCursor?: string; hasMore: boolean };
      setCards((prev) => [...prev, ...data.cards]);
      cursorRef.current = data.nextCursor ?? null;
      hasMoreRef.current = data.hasMore;
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    cursorRef.current = null;
    hasMoreRef.current = true;
    setCards([]);
    try {
      const res = await fetch(apiUrl("/api/feed?limit=10"));
      if (!res.ok) return;
      const data = await res.json() as { cards: FeedCard[]; nextCursor?: string; hasMore: boolean };
      setCards(data.cards);
      cursorRef.current = data.nextCursor ?? null;
      hasMoreRef.current = data.hasMore;
    } finally {
      setRefreshing(false);
    }
  }, []);

  const toggleLike = useCallback((cardId: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, isLiked: !c.isLiked, likesCount: c.isLiked ? c.likesCount - 1 : c.likesCount + 1 }
          : c
      )
    );
  }, []);

  return { cards, loading, refreshing, loadMore, refresh, toggleLike };
}
