"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { VideoCard } from "@/components/VideoCard";
import { PostVideoModal } from "@/components/PostVideoModal";
import { LogoMark } from "@/components/LogoMark";

const WALL_LIMIT = 3;

interface VideoData {
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

export default function VideosPage() {
  const { data: session } = useSession();
  const loggedIn = !!session?.user;
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchVideos = useCallback(() => {
    setLoading(true);
    fetch("/api/videos")
      .then((r) => r.json())
      .then((d: { videos?: VideoData[] }) => setVideos(d.videos ?? []))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  function handlePostClick() {
    if (!session?.user) {
      signIn();
      return;
    }
    setShowModal(true);
  }

  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">Videos</h1>
            <p className="text-white/40 text-sm mt-1">
              Breakthrough research videos from the community
            </p>
          </div>
          <button
            onClick={handlePostClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Post video
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/25">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <p className="text-white/30 text-sm">No videos yet — be the first to post!</p>
            <button
              onClick={handlePostClick}
              className="px-4 py-2 rounded-lg bg-white/8 border border-white/10 text-sm text-white/60 hover:bg-white/12 transition-colors"
            >
              Post a video
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(loggedIn ? videos : videos.slice(0, WALL_LIMIT)).map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
            {!loggedIn && videos.length > WALL_LIMIT && (
              <div className="mt-8 flex flex-col items-center gap-4 py-10 px-6 text-center rounded-2xl bg-white/3 border border-white/8">
                <LogoMark size={44} color="#89CFF0" showGlow={true} />
                <h2 className="text-lg font-bold text-white">See all community videos</h2>
                <p className="text-white/50 text-sm">Create a free account to watch, like, and post videos.</p>
                <Link
                  href="/auth/register"
                  className="w-full py-2.5 rounded-full text-sm font-semibold text-black transition-opacity hover:opacity-90"
                  style={{ background: "#89CFF0" }}
                >
                  Create account
                </Link>
                <Link href="/auth/signin" className="text-white/50 text-sm hover:text-white transition-colors">
                  Sign in
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <PostVideoModal
          onClose={() => setShowModal(false)}
          onPosted={fetchVideos}
        />
      )}
    </main>
  );
}
