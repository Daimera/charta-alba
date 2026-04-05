"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CreatorStats {
  period: number;
  totalCards: number;
  totalViews: number;
  totalLikes: number;
  totalBookmarks: number;
  followerCount: number;
  newFollowers: number;
  pointsEarned: number;
  viewsOverTime: { day: string; views: number }[];
}

interface PostRow {
  id: string;
  headline: string;
  hook: string;
  tldr: string;
  tags: string[];
  views: number;
  likes: number;
  bookmarks: number;
  publishedAt: string | null;
  submissionType: string;
  paperId: string;
}

interface PostsResponse {
  posts: PostRow[];
  total: number;
  hasMore: boolean;
}

type SortField = "date" | "views" | "likes" | "bookmarks";
type Period = 7 | 30 | 90 | 365;

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? "bg-white/8 border-white/15" : "bg-white/4 border-white/8"}`}>
      <p className="text-white/40 text-xs mb-1">{label}</p>
      <p className="text-white text-2xl font-bold tabular-nums">{typeof value === "number" ? fmt(value) : value}</p>
      {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ── Mini bar chart ─────────────────────────────────────────────────────────────

function SparkBar({ data }: { data: { day: string; views: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="h-16 flex items-center justify-center">
        <p className="text-white/20 text-xs">No view data yet</p>
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.views), 1);
  return (
    <div className="flex items-end gap-0.5 h-16" role="img" aria-label="Views over time chart">
      {data.map((d) => (
        <div
          key={d.day}
          className="flex-1 bg-white/25 rounded-sm hover:bg-white/50 transition-colors"
          style={{ height: `${Math.max(4, (d.views / max) * 64)}px` }}
          title={`${d.day}: ${d.views} views`}
        />
      ))}
    </div>
  );
}

// ── Sort button ────────────────────────────────────────────────────────────────

function SortBtn({
  field,
  label,
  current,
  order,
  onClick,
}: {
  field: SortField;
  label: string;
  current: SortField;
  order: "asc" | "desc";
  onClick: (f: SortField) => void;
}) {
  const active = field === current;
  return (
    <button
      onClick={() => onClick(field)}
      className={`flex items-center gap-1 text-xs font-medium transition-colors ${active ? "text-white" : "text-white/35 hover:text-white/60"}`}
    >
      {label}
      {active && <span className="text-white/50">{order === "desc" ? "↓" : "↑"}</span>}
    </button>
  );
}

// ── CSV export ─────────────────────────────────────────────────────────────────

function exportCsv(posts: PostRow[]) {
  const header = "Headline,Type,Views,Likes,Bookmarks,Published\n";
  const rows = posts
    .map((p) =>
      [
        `"${p.headline.replace(/"/g, '""')}"`,
        p.submissionType,
        p.views,
        p.likes,
        p.bookmarks,
        p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : "—",
      ].join(",")
    )
    .join("\n");

  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `creator-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CreatorPage() {
  const { status } = useSession();
  const router = useRouter();

  const [period, setPeriod] = useState<Period>(30);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsLoading, setPostsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status !== "authenticated") return;

    setStatsLoading(true);
    fetch(`/api/creator/stats?days=${period}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: CreatorStats | null) => { if (d) setStats(d); })
      .catch(() => undefined)
      .finally(() => setStatsLoading(false));
  }, [status, period, router]);

  const loadPosts = useCallback(() => {
    if (status !== "authenticated") return;
    setPostsLoading(true);
    fetch(`/api/creator/posts?sort=${sortField}&order=${sortOrder}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: PostsResponse | null) => {
        if (d) { setPosts(d.posts); setPostsTotal(d.total); }
      })
      .catch(() => undefined)
      .finally(() => setPostsLoading(false));
  }, [status, sortField, sortOrder]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
      </div>
    );
  }

  const PERIODS: { label: string; value: Period }[] = [
    { label: "7d", value: 7 },
    { label: "30d", value: 30 },
    { label: "90d", value: 90 },
    { label: "1y", value: 365 },
  ];

  return (
    <main className="min-h-dvh bg-[#0a0a0a] pb-20" id="main-content">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/40 hover:text-white transition-colors" aria-label="Back to feed">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </Link>
            <h1 className="text-white font-bold text-sm">Creator Analytics</h1>
          </div>

          {/* Period tabs */}
          <div className="flex items-center gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  period === p.value
                    ? "bg-white/10 text-white"
                    : "text-white/35 hover:text-white/60"
                }`}
                aria-pressed={period === p.value}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8 pt-6">

        {/* Overview stats grid */}
        {statsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-white/4 border border-white/8 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Published cards" value={stats.totalCards} />
              <StatCard label="Total views" value={stats.totalViews} sub={`Last ${period} days`} highlight />
              <StatCard label="Likes" value={stats.totalLikes} sub={`Last ${period} days`} />
              <StatCard label="Bookmarks" value={stats.totalBookmarks} sub={`Last ${period} days`} />
              <StatCard label="Followers" value={stats.followerCount} />
              <StatCard label="New followers" value={stats.newFollowers} sub={`Last ${period} days`} highlight />
              <StatCard label="Points earned" value={stats.pointsEarned} sub={`Last ${period} days`} />
              <StatCard label="Avg views/card" value={stats.totalCards > 0 ? Math.round(stats.totalViews / stats.totalCards) : 0} />
            </div>

            {/* Views over time */}
            <section aria-labelledby="views-chart-title">
              <div className="flex items-center justify-between mb-3">
                <h2 id="views-chart-title" className="text-white text-sm font-semibold">Views over time</h2>
                <span className="text-white/25 text-xs">Last {Math.min(period, 30)} days</span>
              </div>
              <div className="p-4 rounded-xl bg-white/4 border border-white/8">
                <SparkBar data={stats.viewsOverTime} />
              </div>
            </section>
          </>
        ) : (
          <p className="text-white/30 text-sm text-center py-8">Could not load stats.</p>
        )}

        {/* Content performance table */}
        <section aria-labelledby="posts-table-title">
          <div className="flex items-center justify-between mb-3">
            <h2 id="posts-table-title" className="text-white text-sm font-semibold">
              Content performance
              {postsTotal > 0 && <span className="text-white/30 font-normal ml-2">({postsTotal})</span>}
            </h2>
            {posts.length > 0 && (
              <button
                onClick={() => exportCsv(posts)}
                className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export CSV
              </button>
            )}
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-4 mb-3 px-1">
            <span className="text-white/25 text-xs">Sort:</span>
            <SortBtn field="date" label="Date" current={sortField} order={sortOrder} onClick={handleSort} />
            <SortBtn field="views" label="Views" current={sortField} order={sortOrder} onClick={handleSort} />
            <SortBtn field="likes" label="Likes" current={sortField} order={sortOrder} onClick={handleSort} />
            <SortBtn field="bookmarks" label="Bookmarks" current={sortField} order={sortOrder} onClick={handleSort} />
          </div>

          {postsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-white/4 border border-white/8 animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 border border-white/8 rounded-xl bg-white/2">
              <p className="text-white/30 text-sm mb-2">No published content yet.</p>
              <Link
                href="/submit"
                className="text-white text-sm font-semibold underline underline-offset-2 hover:no-underline"
              >
                Submit your first paper →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-xl bg-white/4 border border-white/8 hover:bg-white/6 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-white/30 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full capitalize">
                          {post.submissionType.replace("_", " ")}
                        </span>
                        {post.tags.slice(0, 2).map((t) => (
                          <span key={t} className="text-xs text-white/25">{t}</span>
                        ))}
                      </div>
                      <p className="text-white text-sm font-medium leading-snug line-clamp-2">{post.headline}</p>
                      <p className="text-white/35 text-xs mt-0.5 line-clamp-1">{post.tldr}</p>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1 text-right">
                      <div className="flex items-center gap-4">
                        <span className="text-white/50 text-xs tabular-nums" title="Views">
                          <span className="text-white/25 mr-1">👁</span>{fmt(post.views)}
                        </span>
                        <span className="text-white/50 text-xs tabular-nums" title="Likes">
                          <span className="text-white/25 mr-1">♥</span>{fmt(post.likes)}
                        </span>
                        <span className="text-white/50 text-xs tabular-nums" title="Bookmarks">
                          <span className="text-white/25 mr-1">◈</span>{fmt(post.bookmarks)}
                        </span>
                      </div>
                      <span className="text-white/20 text-xs">
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Audience section */}
        {stats && stats.followerCount > 0 && (
          <section aria-labelledby="audience-title">
            <h2 id="audience-title" className="text-white text-sm font-semibold mb-3">Audience</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white/4 border border-white/8">
                <p className="text-white/40 text-xs mb-1">Total followers</p>
                <p className="text-white text-2xl font-bold">{fmt(stats.followerCount)}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/4 border border-white/8">
                <p className="text-white/40 text-xs mb-1">New this period</p>
                <p className="text-white text-2xl font-bold">
                  {stats.newFollowers > 0 && <span className="text-green-400">+</span>}{fmt(stats.newFollowers)}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Points */}
        {stats && stats.pointsEarned > 0 && (
          <section aria-labelledby="points-title">
            <h2 id="points-title" className="text-white text-sm font-semibold mb-3">Points earned</h2>
            <div className="p-4 rounded-xl bg-white/4 border border-white/8 flex items-center justify-between">
              <div>
                <p className="text-white text-2xl font-bold">{fmt(stats.pointsEarned)}</p>
                <p className="text-white/40 text-xs mt-0.5">Last {period} days</p>
              </div>
              <Link
                href="/settings/points"
                className="text-xs text-white/40 hover:text-white transition-colors"
              >
                View history →
              </Link>
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
