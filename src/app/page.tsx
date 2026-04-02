import { Suspense } from "react";
import { auth } from "@/lib/auth";
import {
  loadFeed,
  loadUserLikes,
  loadUserBookmarks,
  loadCardCitations,
  loadTrendingTags,
} from "@/lib/queries";
import { FeedShell } from "@/components/FeedShell";

export default async function FeedPage() {
  try {
    const [session, rawCards, trendingTags] = await Promise.all([
      auth(),
      loadFeed(),
      loadTrendingTags(),
    ]);

    let likedIds: string[] = [];
    let bookmarkedIds: string[] = [];

    if (session?.user?.id) {
      [likedIds, bookmarkedIds] = await Promise.all([
        loadUserLikes(session.user.id),
        loadUserBookmarks(session.user.id),
      ]);
    }

    // Merge citation data into feed cards
    const citationsMap = await loadCardCitations(rawCards.map((c) => c.id));
    const feedCards = rawCards.map((c) => ({
      ...c,
      citations: citationsMap[c.id] ?? [],
    }));

    if (feedCards.length === 0) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] pt-14">
          <div className="text-center space-y-2">
            <p className="text-white/50 text-sm">No cards yet.</p>
            <p className="text-white/30 text-xs">Run the seed script to get started.</p>
          </div>
        </main>
      );
    }

    return (
      <Suspense fallback={null}>
        <FeedShell
          cards={feedCards}
          initialLikedIds={likedIds}
          initialBookmarkedIds={bookmarkedIds}
          trendingTags={trendingTags}
        />
      </Suspense>
    );
  } catch {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] pt-14">
        <p className="text-red-400 text-sm">Failed to load feed.</p>
      </main>
    );
  }
}
