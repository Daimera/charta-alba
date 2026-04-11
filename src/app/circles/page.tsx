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
  userRole?: string;
}

function CircleAvatar({ circle }: { circle: Circle }) {
  if (circle.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={circle.avatarUrl} alt={circle.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />;
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

function CircleCard({
  circle,
  badge,
  action,
}: {
  circle: Circle;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/4 border border-white/8 hover:bg-white/6 hover:border-white/12 transition-colors">
      <Link href={`/circles/${circle.id}`} className="flex items-start gap-4 flex-1 min-w-0">
        <CircleAvatar circle={circle} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-semibold text-sm leading-tight truncate">{circle.name}</p>
                {badge}
              </div>
              <p className="text-white/30 text-xs mt-0.5">{circle.memberCount} member{circle.memberCount !== 1 ? "s" : ""}</p>
            </div>
            {!circle.isPublic && (
              <span className="text-xs text-white/30 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full shrink-0">Private</span>
            )}
          </div>
          {circle.description && <p className="text-white/50 text-xs mt-1.5 line-clamp-2">{circle.description}</p>}
          {circle.topicTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {circle.topicTags.slice(0, 4).map((t) => (
                <span key={t} className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}
        </div>
      </Link>
      {action && <div className="shrink-0 self-center">{action}</div>}
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
  const { data: session, status } = useSession();
  const [mine, setMine] = useState<Circle[]>([]);
  const [discover, setDiscover] = useState<Circle[]>([]);
  const [searchResults, setSearchResults] = useState<Circle[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const fetchCircles = useCallback(() => {
    setLoading(true);
    fetch("/api/circles")
      .then((r) => r.json())
      .then((d: { mine?: Circle[]; discover?: Circle[]; circles?: Circle[] }) => {
        if (d.mine !== undefined) {
          setMine(d.mine);
          setDiscover(d.discover ?? []);
        } else {
          // Unauthenticated — all in discover
          setMine([]);
          setDiscover(d.circles ?? []);
        }
      })
      .catch(() => { setMine([]); setDiscover([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCircles(); }, [fetchCircles, status]);

  // Debounced search
  useEffect(() => {
    if (!search.trim()) { setSearchResults(null); return; }
    const t = setTimeout(() => {
      fetch(`/api/circles?q=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((d: { circles?: Circle[] }) => setSearchResults(d.circles ?? []))
        .catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function handleJoin(circleId: string) {
    if (!session?.user) { signIn(); return; }
    setJoiningId(circleId);
    try {
      const res = await fetch(`/api/circles/${circleId}/join`, { method: "POST" });
      if (res.ok) {
        fetchCircles();
      }
    } finally {
      setJoiningId(null);
    }
  }

  function handleCreate() {
    if (!session?.user) { signIn(); return; }
    setShowCreate(true);
  }

  const mineIds = new Set(mine.map((c) => c.id));

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

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
          </div>
        ) : searchResults !== null ? (
          /* Search results */
          <div className="space-y-3">
            {searchResults.length === 0 ? (
              <p className="text-center text-white/30 text-sm py-12">No Circles match your search.</p>
            ) : (
              searchResults.map((c) => (
                <CircleCard
                  key={c.id}
                  circle={c}
                  action={
                    !mineIds.has(c.id) && c.isPublic ? (
                      <button
                        onClick={() => handleJoin(c.id)}
                        disabled={joiningId === c.id}
                        className="px-3 py-1.5 rounded-lg bg-white/8 border border-white/12 text-xs text-white/70 hover:bg-white/14 hover:text-white transition-colors disabled:opacity-50"
                      >
                        {joiningId === c.id ? "…" : "Join"}
                      </button>
                    ) : undefined
                  }
                />
              ))
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Your Circles */}
            {session?.user && (
              <section>
                <h2 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">Your Circles</h2>
                {mine.length === 0 ? (
                  <div className="text-center py-8 rounded-2xl border border-white/6 bg-white/2">
                    <p className="text-white/30 text-sm mb-3">You haven&apos;t joined any Circles yet.</p>
                    <button onClick={handleCreate} className="px-4 py-2 rounded-lg bg-white/8 border border-white/10 text-sm text-white/60 hover:bg-white/12 transition-colors">
                      Create your first Circle
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mine.map((c) => (
                      <CircleCard
                        key={c.id}
                        circle={c}
                        badge={
                          c.userRole === "owner" ? (
                            <span className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">Owner</span>
                          ) : undefined
                        }
                        action={
                          c.userRole === "owner" ? (
                            <Link
                              href={`/circles/${c.id}/manage`}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 hover:bg-amber-500/18 transition-colors"
                            >
                              Manage
                            </Link>
                          ) : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Discover */}
            <section>
              <h2 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">Discover</h2>
              {discover.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/30 text-sm">
                    {mine.length > 0 ? "You've joined all public Circles!" : "No public Circles yet — start one!"}
                  </p>
                  {mine.length === 0 && (
                    <button onClick={handleCreate} className="mt-3 px-4 py-2 rounded-lg bg-white/8 border border-white/10 text-sm text-white/60 hover:bg-white/12 transition-colors">
                      Create a Circle
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {discover.map((c) => (
                    <CircleCard
                      key={c.id}
                      circle={c}
                      action={
                        c.isPublic ? (
                          <button
                            onClick={() => handleJoin(c.id)}
                            disabled={joiningId === c.id}
                            className="px-3 py-1.5 rounded-lg bg-white/8 border border-white/12 text-xs text-white/70 hover:bg-white/14 hover:text-white transition-colors disabled:opacity-50"
                          >
                            {joiningId === c.id ? "…" : "Join"}
                          </button>
                        ) : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateCircleModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => {
            setMine((prev) => [{ ...c, userRole: "owner" }, ...prev]);
          }}
        />
      )}
    </main>
  );
}
