"use client";

import { useState, useEffect } from "react";

interface Paper {
  id: string;
  title: string;
}

interface PostVideoModalProps {
  onClose: () => void;
  onPosted: () => void;
}

export function PostVideoModal({ onClose, onPosted }: PostVideoModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [paperId, setPaperId] = useState("");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load recent papers for the optional dropdown
    fetch("/api/top?window=all")
      .then((r) => r.json())
      .then((d: { cards?: Array<{ paperId: string; paperTitle: string | null }> }) => {
        const seen = new Set<string>();
        const list: Paper[] = [];
        for (const c of d.cards ?? []) {
          if (c.paperId && !seen.has(c.paperId) && c.paperTitle) {
            seen.add(c.paperId);
            list.push({ id: c.paperId, title: c.paperTitle });
          }
        }
        setPapers(list.slice(0, 50));
      })
      .catch(() => undefined);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !description.trim() || !videoUrl.trim()) {
      setError("Title, description, and video URL are required.");
      return;
    }

    try {
      new URL(videoUrl);
    } catch {
      setError("Please enter a valid video URL.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        videoUrl: videoUrl.trim(),
        paperId: paperId || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const d = await res.json() as { error?: string };
      setError(d.error ?? "Failed to post video.");
      return;
    }

    onPosted();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0 fade-in">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-5 space-y-4 drawer-enter sm:animate-none">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">Post a video</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-white/50 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
              placeholder="What's this video about?"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              maxLength={500}
              placeholder="Give some context about the video…"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1">Video URL</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              required
              placeholder="https://youtube.com/watch?v=… or direct URL"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
            />
          </div>

          {papers.length > 0 && (
            <div>
              <label className="block text-xs text-white/50 mb-1">Related paper (optional)</label>
              <select
                value={paperId}
                onChange={(e) => setPaperId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
              >
                <option value="">None</option>
                {papers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title.length > 70 ? p.title.slice(0, 67) + "…" : p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Posting…" : "Post video"}
          </button>
        </form>
      </div>
    </div>
  );
}
