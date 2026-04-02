"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

interface Circle {
  id: string;
  name: string;
  description: string | null;
  topicTags: string[];
  avatarUrl: string | null;
  isPublic: boolean;
  ownerId: string;
  memberCount: number;
  createdAt: string | null;
  ownerName: string | null;
}

function CircleAvatar({ circle }: { circle: Circle }) {
  if (circle.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={circle.avatarUrl} alt={circle.name} className="w-12 h-12 rounded-xl object-cover" />;
  }
  const initials = circle.name.slice(0, 2).toUpperCase();
  const colors = ["bg-violet-500/30", "bg-blue-500/30", "bg-green-500/30", "bg-amber-500/30", "bg-red-500/30"];
  const color = colors[circle.name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
      {initials}
    </div>
  );
}

function CreateCircleModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Circle) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    setError(""); setLoading(true);
    const res = await fetch("/api/circles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || undefined,
        topicTags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        isPublic,
      }),
    });
    setLoading(false);
    if (!res.ok) { const d = await res.json() as { error?: string }; setError(d.error ?? "Failed to create."); return; }
    const d = await res.json() as { circle: Circle };
    onCreated(d.circle);
    onClose();
  }

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0 fade-in">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-5 space-y-4 drawer-enter sm:animate-none">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">Create a Circle</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          <div>
            <label className="block text-xs text-white/50 mb-1">Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder="e.g. LLM Safety Research" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={300} placeholder="What is this Circle about?" className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Topics (comma-separated, max 5)</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="llm, safety, alignment" className={inputCls} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-4 h-4 accent-white rounded" />
            <span className="text-sm text-white/70">Public Circle (anyone can join)</span>
          </label>
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors">
            {loading ? "Creating…" : "Create Circle"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CirclesPage() {
  const { data: session } = useSession();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const fetchCircles = useCallback((q?: string) => {
    setLoading(true);
    const url = q ? `/api/circles?q=${encodeURIComponent(q)}` : "/api/circles";
    fetch(url)
      .then((r) => r.json())
      .then((d: { circles?: Circle[] }) => setCircles(d.circles ?? []))
      .catch(() => setCircles([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCircles(); }, [fetchCircles]);

  useEffect(() => {
    const t = setTimeout(() => fetchCircles(search || undefined), 300);
    return () => clearTimeout(t);
  }, [search, fetchCircles]);

  function handleCreate() {
    if (!session?.user) { signIn(); return; }
    setShowCreate(true);
  }

  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">Circles</h1>
            <p className="text-white/40 text-sm mt-1">Research collaboration groups</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New Circle
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Circles by name or topic…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/25 transition-colors"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
          </div>
        ) : circles.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/25">
                <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
            <p className="text-white/30 text-sm">{search ? "No Circles match your search." : "No Circles yet — start one!"}</p>
            <button onClick={handleCreate} className="px-4 py-2 rounded-lg bg-white/8 border border-white/10 text-sm text-white/60 hover:bg-white/12 transition-colors">
              Create a Circle
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {circles.map((c) => (
              <Link key={c.id} href={`/circles/${c.id}`} className="flex items-start gap-4 p-4 rounded-2xl bg-white/4 border border-white/8 hover:bg-white/6 hover:border-white/12 transition-colors">
                <CircleAvatar circle={c} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-white font-semibold text-sm leading-tight">{c.name}</p>
                      <p className="text-white/30 text-xs mt-0.5">{c.memberCount} member{c.memberCount !== 1 ? "s" : ""}</p>
                    </div>
                    {!c.isPublic && (
                      <span className="text-xs text-white/30 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full shrink-0">Private</span>
                    )}
                  </div>
                  {c.description && <p className="text-white/50 text-xs mt-1.5 line-clamp-2">{c.description}</p>}
                  {c.topicTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {c.topicTags.slice(0, 4).map((t) => (
                        <span key={t} className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateCircleModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => setCircles((prev) => [c, ...prev])}
        />
      )}
    </main>
  );
}
