"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";

interface VideoCardData {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  userId: string;
  paperId: string | null;
  likeCount: number;
  createdAt: string | null;
  authorName: string | null;
  authorImage: string | null;
  paperTitle: string | null;
}

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
  } catch {
    // not a valid URL
  }
  return null;
}

function timeAgo(date: string | null): string {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function VideoCard({
  video,
  initialLiked = false,
}: {
  video: VideoCardData;
  initialLiked?: boolean;
}) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(video.likeCount);
  const [liking, setLiking] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  const videoId = getYouTubeId(video.videoUrl);
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : null;

  async function handleLike() {
    if (!session?.user) {
      signIn();
      return;
    }
    if (liking) return;
    setLiking(true);

    const method = liked ? "DELETE" : "POST";
    const res = await fetch(`/api/videos/${video.id}/like`, { method });
    if (res.ok) {
      const data = await res.json() as { liked: boolean; likeCount: number };
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    }
    setLiking(false);
  }

  function handleShare() {
    const url = `${window.location.origin}/videos#${video.id}`;
    if (navigator.share) {
      navigator.share({ title: video.title, url });
    } else {
      navigator.clipboard.writeText(url).catch(() => undefined);
    }
  }

  return (
    <div id={video.id} className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden">
      {/* Video area */}
      {videoId ? (
        showEmbed ? (
          <div className="relative w-full aspect-video bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        ) : (
          <button
            onClick={() => setShowEmbed(true)}
            className="relative w-full aspect-video bg-black/40 group overflow-hidden"
            aria-label="Play video"
          >
            {thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailUrl}
                alt={video.title}
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </div>
          </button>
        )
      ) : (
        <div className="w-full aspect-video bg-white/4 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </div>
      )}

      {/* Card body */}
      <div className="p-4 space-y-3">
        {/* Author */}
        <div className="flex items-center gap-2">
          {video.authorImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.authorImage}
              alt={video.authorName ?? ""}
              className="w-6 h-6 rounded-full object-cover ring-1 ring-white/15"
            />
          ) : (
            <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-[10px] font-medium text-white shrink-0">
              {(video.authorName ?? "?")?.[0]?.toUpperCase()}
            </span>
          )}
          <span className="text-white/50 text-xs">{video.authorName ?? "Anonymous"}</span>
          <span className="text-white/20 text-xs">·</span>
          <span className="text-white/30 text-xs">{timeAgo(video.createdAt)}</span>
        </div>

        {/* Title */}
        <h3 className="text-white font-semibold text-sm leading-snug">{video.title}</h3>

        {/* Description */}
        <p className="text-white/50 text-sm leading-relaxed line-clamp-3">{video.description}</p>

        {/* Related paper */}
        {video.paperTitle && (
          <div className="flex items-center gap-1.5 text-xs text-white/35">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="line-clamp-1">{video.paperTitle}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-1">
          <button
            onClick={handleLike}
            disabled={liking}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              liked ? "text-red-400" : "text-white/40 hover:text-white/70"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="tabular-nums">{likeCount}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
