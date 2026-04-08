"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FeedCardData } from "@/types";
import { FeedShell } from "@/components/FeedShell";

export default function FollowingFeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cards, setCards] = useState<FeedCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState<"not_following" | "no_activity" | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/auth/signin?callbackUrl=/following");
      return;
    }

    fetch("/api/feed/following")
      .then(r => r.ok ? r.json() : null)
      .then((d: { cards?: FeedCardData[]; empty?: string } | null) => {
        if (d?.empty) {
          setEmpty(d.empty as "not_following" | "no_activity");
        } else if (d?.cards) {
          setCards(d.cards.map(c => ({ ...c, citations: [] })));
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [session?.user, status]);

  if (status === "loading" || loading) {
    return (
      <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
      </main>
    );
  }

  if (!session?.user) return null;

  if (empty === "not_following") {
    return (
      <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex items-center justify-center" id="main-content">
        <div className="text-center max-w-xs">
          <p className="text-white font-semibold mb-2">No one to follow yet</p>
          <p className="text-white/45 text-sm mb-4">
            Follow researchers to see their liked papers here.
          </p>
          <Link href="/" className="text-white/60 hover:text-white text-sm underline underline-offset-2 transition-colors">
            Browse the main feed →
          </Link>
        </div>
      </main>
    );
  }

  if (empty === "no_activity" || cards.length === 0) {
    return (
      <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex items-center justify-center" id="main-content">
        <div className="text-center max-w-xs">
          <p className="text-white font-semibold mb-2">Nothing here yet</p>
          <p className="text-white/45 text-sm mb-4">
            The people you follow haven&apos;t liked any papers recently.
          </p>
          <Link href="/" className="text-white/60 hover:text-white text-sm underline underline-offset-2 transition-colors">
            Browse the main feed →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <FeedShell
      cards={cards}
      initialLikedIds={[]}
      initialBookmarkedIds={[]}
      trendingTags={[]}
    />
  );
}
