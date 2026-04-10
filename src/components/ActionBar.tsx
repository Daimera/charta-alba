"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";

interface ActionBarProps {
  cardId: string;
  initialLiked: boolean;
  initialLikeCount: number;
  initialBookmarked: boolean;
  initialBookmarkCount: number;
  initialRating: number | null;
  commentCount: number;
  onLike: () => void;
  onOpenComments: () => void;
  onOpenAskAI: () => void;
  onOpenClaims: () => void;
  onOpenCollections: () => void;
}

export function ActionBar({
  cardId,
  initialLiked,
  initialLikeCount,
  initialBookmarked,
  initialBookmarkCount,
  initialRating,
  commentCount,
  onLike,
  onOpenComments,
  onOpenAskAI,
  onOpenClaims,
  onOpenCollections,
}: ActionBarProps) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(initialBookmarkCount);
  const [rating, setRating] = useState<number | null>(initialRating);
  const [ratingExpanded, setRatingExpanded] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share");
  const likeInFlight = useRef(false);
  const bookmarkInFlight = useRef(false);

  const handleLike = async () => {
    if (!session) { onLike(); return; }
    if (likeInFlight.current) return;
    likeInFlight.current = true;

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    if (!wasLiked) {
      setHeartAnimating(true);
      onLike();
      setTimeout(() => setHeartAnimating(false), 400);
    }

    try {
      await fetch(`/api/cards/${cardId}/like`, {
        method: wasLiked ? "DELETE" : "POST",
      });
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : c - 1));
    } finally {
      likeInFlight.current = false;
    }
  };

  const handleBookmark = async () => {
    if (!session) return;
    if (bookmarkInFlight.current) return;
    bookmarkInFlight.current = true;

    const wasBookmarked = bookmarked;
    setBookmarked(!wasBookmarked);
    setBookmarkCount((c) => (wasBookmarked ? c - 1 : c + 1));

    try {
      await fetch(`/api/cards/${cardId}/bookmark`, {
        method: wasBookmarked ? "DELETE" : "POST",
      });
    } catch {
      setBookmarked(wasBookmarked);
      setBookmarkCount((c) => (wasBookmarked ? c + 1 : c - 1));
    } finally {
      bookmarkInFlight.current = false;
    }
  };

  const handleRate = async (r: number) => {
    if (!session) return;
    setRating(r);
    setRatingExpanded(false);
    try {
      await fetch(`/api/cards/${cardId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: r }),
      });
    } catch {
      // Rating failed silently — value stays optimistic
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/paper/${cardId}`;
    if (navigator.share) {
      await navigator.share({ url });
    } else {
      await navigator.clipboard.writeText(url);
      setShareLabel("Copied!");
      setTimeout(() => setShareLabel("Share"), 2000);
    }
  };

  return (
    <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 z-10">
      {/* Like */}
      <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
            liked ? "bg-red-500/20" : "bg-black/40 group-hover:bg-white/10"
          } ${heartAnimating ? "heart-pop" : ""}`}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill={liked ? "#ef4444" : "none"}
            stroke={liked ? "#ef4444" : "rgba(255,255,255,0.8)"}
            strokeWidth="1.8"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
        <span className="text-white/70 text-xs tabular-nums">{likeCount}</span>
      </button>

      {/* Bookmark */}
      <button onClick={handleBookmark} className="flex flex-col items-center gap-1 group">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
            bookmarked ? "bg-yellow-500/20" : "bg-black/40 group-hover:bg-white/10"
          }`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={bookmarked ? "#eab308" : "none"}
            stroke={bookmarked ? "#eab308" : "rgba(255,255,255,0.8)"}
            strokeWidth="1.8"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <span className="text-white/70 text-xs tabular-nums">{bookmarkCount > 0 ? bookmarkCount : (bookmarked ? "Saved" : "Save")}</span>
      </button>

      {/* Collections */}
      <button onClick={onOpenCollections} className="flex flex-col items-center gap-1 group">
        <div className="w-11 h-11 rounded-full bg-black/40 group-hover:bg-white/10 flex items-center justify-center transition-colors">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="1.8"
          >
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
        </div>
        <span className="text-white/70 text-xs">Collect</span>
      </button>

      {/* Share */}
      <button onClick={handleShare} className="flex flex-col items-center gap-1 group">
        <div className="w-11 h-11 rounded-full bg-black/40 group-hover:bg-white/10 flex items-center justify-center transition-colors">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="1.8"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16,6 12,2 8,6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </div>
        <span className="text-white/70 text-xs">{shareLabel}</span>
      </button>

      {/* Compact pill rating */}
      <div className="relative flex flex-col items-center gap-1">
        {ratingExpanded && (
          <div className="absolute flex flex-col gap-1 bg-black/85 backdrop-blur rounded-xl p-1.5" style={{ right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => handleRate(n)}
                className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                  rating === n
                    ? "bg-yellow-400 text-black"
                    : "bg-white/15 text-white/70 hover:bg-white/25"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setRatingExpanded((e) => !e)}
          className="w-11 h-11 rounded-full bg-black/40 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <span
            className={`text-sm font-bold leading-none ${
              rating ? "text-yellow-400" : "text-white/55"
            }`}
          >
            {rating ? `${rating}★` : "★"}
          </span>
        </button>
        <span className="text-white/70 text-xs">{rating ? "Rated" : "Rate"}</span>
      </div>

      {/* Comments */}
      <button onClick={onOpenComments} className="flex flex-col items-center gap-1 group">
        <div className="w-11 h-11 rounded-full bg-black/40 group-hover:bg-white/10 flex items-center justify-center transition-colors">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="1.8"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <span className="text-white/70 text-xs tabular-nums">{commentCount}</span>
      </button>

      {/* Ask AI */}
      <button onClick={onOpenAskAI} className="flex flex-col items-center gap-1 group">
        <div className="w-11 h-11 rounded-full bg-indigo-500/20 group-hover:bg-indigo-500/30 flex items-center justify-center transition-colors">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#818cf8"
            strokeWidth="1.8"
          >
            <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
          </svg>
        </div>
        <span className="text-indigo-400 text-xs">Ask AI</span>
      </button>

      {/* Claim */}
      <button onClick={onOpenClaims} className="flex flex-col items-center gap-1 group">
        <div className="w-11 h-11 rounded-full bg-black/40 group-hover:bg-white/10 flex items-center justify-center transition-colors">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.8"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22,4 12,14.01 9,11.01" />
          </svg>
        </div>
        <span className="text-white/40 text-xs">Claim</span>
      </button>
    </div>
  );
}
