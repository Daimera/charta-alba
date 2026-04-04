"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { countryFlag } from "@/lib/geo";

interface ProfileData {
  id: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  totalViews: number;
  viewsThisWeek: number;
  uniqueCountries?: number;
}

interface Analytics {
  totalViews: number;
  viewsToday: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  topCountries: { country: string; countryCode: string; count: number; flag: string }[];
  topCities: { city: string; country: string; count: number }[];
  viewsByDay: { date: string; count: number }[];
  deviceBreakdown: { mobile: number; desktop: number; tablet: number };
  browserBreakdown: Record<string, number>;
  recentViewers: { username: string; city: string | null; country: string | null; flag: string; device: string | null; viewedAt: string | null }[];
}

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const { data: session } = useSession();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;

    // Record the view (fire-and-forget)
    fetch(`/api/profiles/${username}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referrer: document.referrer || null }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d: { totalViews?: number; viewsThisWeek?: number; selfView?: boolean } | null) => {
        if (d && !d.selfView) {
          setProfile((prev) =>
            prev ? { ...prev, totalViews: d.totalViews ?? prev.totalViews, viewsThisWeek: d.viewsThisWeek ?? prev.viewsThisWeek } : prev
          );
        }
      })
      .catch(() => undefined);

    // Load public profile data via settings API (just use the username to find the profile)
    fetch(`/api/profiles/${username}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.ok ? r.json() : null;
      })
      .then((d: ProfileData | null) => {
        if (d) setProfile(d);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [username]);

  async function loadAnalytics() {
    if (!username) return;
    setAnalyticsLoading(true);
    const res = await fetch(`/api/profiles/${username}/analytics`);
    if (res.ok) {
      const d = await res.json() as Analytics;
      setAnalytics(d);
      setShowAnalytics(true);
    }
    setAnalyticsLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
      </main>
    );
  }

  if (notFound || !profile) {
    return (
      <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg font-semibold">Profile not found</p>
          <p className="text-white/40 text-sm mt-1">@{username} doesn&apos;t exist.</p>
        </div>
      </main>
    );
  }

  const isOwner = session?.user?.id === profile.id;

  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile header */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold text-white shrink-0">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={profile.username ?? ""} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              (profile.username ?? "?")[0].toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-xl font-bold">@{profile.username}</h1>
            {profile.bio && <p className="text-white/60 text-sm mt-1 leading-relaxed">{profile.bio}</p>}
            {/* Public stats */}
            <div className="flex items-center gap-4 mt-3">
              <div className="text-center">
                <p className="text-white font-semibold text-sm">{(profile.totalViews ?? 0).toLocaleString()}</p>
                <p className="text-white/35 text-xs">profile views</p>
              </div>
              {(profile.uniqueCountries ?? 0) > 0 && (
                <div className="text-center">
                  <p className="text-white font-semibold text-sm">{profile.uniqueCountries}</p>
                  <p className="text-white/35 text-xs">countries</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Owner analytics toggle */}
        {isOwner && (
          <div>
            {!showAnalytics ? (
              <button
                onClick={loadAnalytics}
                disabled={analyticsLoading}
                className="text-sm text-white/40 hover:text-white border border-white/8 hover:border-white/20 px-4 py-2 rounded-xl transition-colors"
              >
                {analyticsLoading ? "Loading analytics…" : "View profile analytics"}
              </button>
            ) : analytics ? (
              <ProfileAnalytics analytics={analytics} />
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}

function ProfileAnalytics({ analytics }: { analytics: Analytics }) {
  // Simple bar chart using CSS widths
  const maxDay = Math.max(...analytics.viewsByDay.map((d) => d.count), 1);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total views", value: analytics.totalViews },
          { label: "This month",  value: analytics.viewsThisMonth },
          { label: "This week",   value: analytics.viewsThisWeek },
          { label: "Today",       value: analytics.viewsToday },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-xl bg-white/4 border border-white/8 text-center">
            <p className="text-white font-bold text-lg">{s.value.toLocaleString()}</p>
            <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Views by day */}
      {analytics.viewsByDay.length > 0 && (
        <div>
          <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Views — last 30 days</p>
          <div className="flex items-end gap-0.5 h-16">
            {analytics.viewsByDay.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.count}`}
                style={{ height: `${Math.max(4, (d.count / maxDay) * 100)}%` }}
                className="flex-1 bg-white/25 hover:bg-white/50 rounded-sm transition-colors min-w-0"
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-white/20 text-xs">{analytics.viewsByDay[0]?.date}</span>
            <span className="text-white/20 text-xs">{analytics.viewsByDay[analytics.viewsByDay.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Top countries */}
      {analytics.topCountries.length > 0 && (
        <div>
          <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Top countries</p>
          <div className="space-y-2">
            {analytics.topCountries.slice(0, 5).map((c) => {
              const maxCount = analytics.topCountries[0].count;
              return (
                <div key={c.countryCode} className="flex items-center gap-2">
                  <span className="text-base shrink-0">{c.flag}</span>
                  <span className="text-white/60 text-xs w-28 truncate shrink-0">{c.country}</span>
                  <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/40 rounded-full"
                      style={{ width: `${(c.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-white/40 text-xs shrink-0 w-8 text-right">{c.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Device breakdown */}
      <div>
        <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Devices</p>
        <div className="flex gap-3">
          {Object.entries(analytics.deviceBreakdown)
            .filter(([, v]) => v > 0)
            .map(([type, count]) => (
              <div key={type} className="flex-1 p-3 rounded-xl bg-white/4 border border-white/8 text-center">
                <p className="text-white font-semibold">{count}</p>
                <p className="text-white/35 text-xs mt-0.5 capitalize">{type}</p>
              </div>
            ))}
        </div>
      </div>

      {/* Recent viewers */}
      {analytics.recentViewers.length > 0 && (
        <div>
          <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Recent viewers</p>
          <div className="space-y-1.5">
            {analytics.recentViewers.slice(0, 10).map((v, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/3 border border-white/6">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm">{v.flag}</span>
                  <div className="min-w-0">
                    <span className="text-white/70 text-xs">{v.username}</span>
                    {(v.city || v.country) && (
                      <p className="text-white/30 text-xs">{[v.city, v.country].filter(Boolean).join(", ")}</p>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-white/25 text-xs">{v.device}</p>
                  <p className="text-white/20 text-xs">
                    {v.viewedAt ? new Date(v.viewedAt).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
