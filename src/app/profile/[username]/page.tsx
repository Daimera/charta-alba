"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { TierBadge } from "@/components/TierBadge";

interface ProfileData {
  id: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  totalViews: number;
  viewsThisWeek: number;
  uniqueCountries?: number;
  followerCount: number;
  followingCount: number;
  subscriptionTier?: string;
  joinedAt: string | null;
  isOrcidVerified?: boolean;
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

interface FollowUser {
  userId: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  followerCount: number;
  isFollowingBack: boolean;
}

type ProfileTab = "papers" | "videos" | "about" | "followers" | "following";

interface LikedCard {
  id: string;
  headline: string;
  hook: string;
  tags: string[];
  readingTimeSeconds: number;
  arxivUrl: string | null;
}

function Avatar({ url, name, size = 80 }: { url: string | null; name: string | null; size?: number }) {
  const dim = `${size}px`;
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name ?? ""} className="rounded-full object-cover ring-2 ring-white/10" style={{ width: dim, height: dim }} />;
  }
  return (
    <div className="rounded-full bg-white/10 flex items-center justify-center font-bold text-white" style={{ width: dim, height: dim, fontSize: size / 2.5 }}>
      {(name ?? "?")[0].toUpperCase()}
    </div>
  );
}

function FollowUserCard({ user, viewerUsername, onFollowChange }: {
  user: FollowUser;
  viewerUsername: string | null | undefined;
  onFollowChange?: () => void;
}) {
  const [following, setFollowing] = useState(user.isFollowingBack);
  const [loading, setLoading] = useState(false);
  const isOwn = viewerUsername === user.username;

  async function toggle() {
    if (!user.username) return;
    setLoading(true);
    const method = following ? "DELETE" : "POST";
    const res = await fetch(`/api/users/${user.username}/follow`, { method });
    if (res.ok) {
      setFollowing(!following);
      onFollowChange?.();
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/6">
      <Link href={user.username ? `/profile/${user.username}` : "#"}>
        <Avatar url={user.avatarUrl} name={user.displayName ?? user.username} size={44} />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={user.username ? `/profile/${user.username}` : "#"} className="block">
          <p className="text-white text-sm font-semibold truncate">{user.displayName ?? user.username}</p>
          {user.username && <p className="text-white/40 text-xs">@{user.username}</p>}
        </Link>
        {user.bio && <p className="text-white/50 text-xs mt-0.5 line-clamp-1">{user.bio}</p>}
      </div>
      {!isOwn && (
        <button
          onClick={toggle}
          disabled={loading}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            following
              ? "bg-white/10 text-white/70 hover:bg-red-500/20 hover:text-red-400"
              : "bg-white text-black hover:bg-white/90"
          }`}
        >
          {loading ? "…" : following ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const { data: session } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("papers");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerUsers, setFollowerUsers] = useState<FollowUser[]>([]);
  const [followingUsers, setFollowingUsers] = useState<FollowUser[]>([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const [likedCards, setLikedCards] = useState<LikedCard[]>([]);
  const [likedLoading, setLikedLoading] = useState(false);
  const [ownerStats, setOwnerStats] = useState<{ savedCount: number; likedCount: number; commentCount: number } | null>(null);

  useEffect(() => {
    if (!username) return;

    fetch(`/api/profiles/${username}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referrer: document.referrer || null }),
    }).catch(() => undefined);

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

  // Check if viewer follows this profile
  useEffect(() => {
    if (!session?.user?.id || !profile?.id || session.user.id === profile.id) return;
    fetch(`/api/users/${username}/followers`)
      .then(r => r.ok ? r.json() : null)
      .then((d: { items: FollowUser[] } | null) => {
        if (d) {
          const found = d.items.some((u) => u.userId === session.user?.id);
          setIsFollowing(found);
        }
      })
      .catch(() => undefined);
  }, [username, profile?.id, session?.user?.id]);

  const loadFollowList = useCallback(async (type: "followers" | "following") => {
    setFollowListLoading(true);
    const res = await fetch(`/api/users/${username}/${type}`);
    if (res.ok) {
      const d = await res.json() as { items: FollowUser[] };
      if (type === "followers") setFollowerUsers(d.items);
      else setFollowingUsers(d.items);
    }
    setFollowListLoading(false);
  }, [username]);

  useEffect(() => {
    if (activeTab === "followers") loadFollowList("followers");
    if (activeTab === "following") loadFollowList("following");
    if (activeTab === "papers" && likedCards.length === 0) {
      setLikedLoading(true);
      fetch(`/api/profiles/${username}/liked`)
        .then((r) => r.ok ? r.json() : null)
        .then((d: { cards: LikedCard[] } | null) => {
          if (d?.cards) setLikedCards(d.cards);
        })
        .catch(() => undefined)
        .finally(() => setLikedLoading(false));
    }
  }, [activeTab, loadFollowList, username]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAnalytics() {
    setAnalyticsLoading(true);
    const res = await fetch(`/api/profiles/${username}/analytics`);
    if (res.ok) {
      const d = await res.json() as Analytics;
      setAnalytics(d);
      setShowAnalytics(true);
    }
    setAnalyticsLoading(false);
  }

  async function toggleFollow() {
    if (!session?.user) { router.push("/auth/signin"); return; }
    setFollowLoading(true);
    const method = isFollowing ? "DELETE" : "POST";
    const res = await fetch(`/api/users/${username}/follow`, { method });
    if (res.ok) {
      const d = await res.json() as { following: boolean; followerCount: number };
      setIsFollowing(d.following);
      setProfile(prev => prev ? { ...prev, followerCount: d.followerCount } : prev);
    }
    setFollowLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" aria-label="Loading" />
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

  // Load owner stats once we know this is the owner
  useEffect(() => {
    if (!isOwner || ownerStats) return;
    fetch("/api/settings")
      .then(r => r.ok ? r.json() : null)
      .then((d: { stats?: { savedCount?: number; likedCount?: number; commentCount?: number } } | null) => {
        if (d?.stats) {
          setOwnerStats({
            savedCount: d.stats.savedCount ?? 0,
            likedCount: d.stats.likedCount ?? 0,
            commentCount: d.stats.commentCount ?? 0,
          });
        }
      })
      .catch(() => undefined);
  }, [isOwner, ownerStats]);

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "papers",  label: "Papers" },
    { id: "videos",  label: "Videos" },
    { id: "about",   label: "About" },
  ];

  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14" id="main-content">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Profile header */}
        <div className="flex items-start gap-5 mb-6">
          <Avatar url={profile.avatarUrl} name={profile.displayName ?? profile.username} size={80} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-white text-xl font-bold">
                {profile.displayName ?? profile.username}
              </h1>
              <TierBadge tier={profile.subscriptionTier} />
              {profile.isOrcidVerified && (
                <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 text-xs font-medium border border-green-500/20">
                  ✓ ORCID
                </span>
              )}
            </div>
            {profile.username && (
              <p className="text-white/45 text-sm">@{profile.username}</p>
            )}
            {profile.bio && (
              <p className="text-white/65 text-sm mt-2 leading-relaxed">{profile.bio}</p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-5 mt-3">
              <button
                onClick={() => setActiveTab("followers")}
                className="text-center hover:opacity-80 transition-opacity"
              >
                <p className="text-white font-semibold text-sm">{profile.followerCount.toLocaleString()}</p>
                <p className="text-white/35 text-xs">followers</p>
              </button>
              <button
                onClick={() => setActiveTab("following")}
                className="text-center hover:opacity-80 transition-opacity"
              >
                <p className="text-white font-semibold text-sm">{profile.followingCount.toLocaleString()}</p>
                <p className="text-white/35 text-xs">following</p>
              </button>
              {profile.totalViews > 0 && (
                <div className="text-center">
                  <p className="text-white font-semibold text-sm">{profile.totalViews.toLocaleString()}</p>
                  <p className="text-white/35 text-xs">profile views</p>
                </div>
              )}
            </div>

            {profile.joinedAt && (
              <p className="text-white/25 text-xs mt-2">
                Member since {new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3">
              {isOwner ? (
                <>
                  <Link
                    href="/settings/profile"
                    className="px-4 py-1.5 rounded-lg border border-white/20 text-white/80 text-sm font-medium hover:bg-white/8 transition-colors"
                  >
                    Edit Profile
                  </Link>
                  <Link
                    href="/creator"
                    className="px-4 py-1.5 rounded-lg border border-white/20 text-white/80 text-sm font-medium hover:bg-white/8 transition-colors"
                  >
                    Creator Dashboard
                  </Link>
                </>
              ) : (
                <button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  aria-label={isFollowing ? "Unfollow" : "Follow"}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isFollowing
                      ? "bg-white/10 text-white/70 hover:bg-red-500/20 hover:text-red-400 border border-white/10"
                      : "bg-white text-black hover:bg-white/90"
                  }`}
                >
                  {followLoading ? "…" : isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Owner private panel */}
        {isOwner && (
          <div className="mb-6 space-y-3">
            {/* Your activity stats */}
            {ownerStats && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Saved", value: ownerStats.savedCount, href: "/saved" },
                  { label: "Liked", value: ownerStats.likedCount, href: null },
                  { label: "Comments", value: ownerStats.commentCount, href: null },
                ].map((s) => (
                  s.href ? (
                    <Link key={s.label} href={s.href} className="p-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/6 transition-colors text-center">
                      <p className="text-white font-bold text-lg">{s.value.toLocaleString()}</p>
                      <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
                    </Link>
                  ) : (
                    <div key={s.label} className="p-3 rounded-xl bg-white/4 border border-white/8 text-center">
                      <p className="text-white font-bold text-lg">{s.value.toLocaleString()}</p>
                      <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
                    </div>
                  )
                ))}
              </div>
            )}
            {/* Quick links */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/settings/account",   label: "Account settings" },
                { href: "/settings/security",  label: "Security" },
                { href: "/developers/dashboard", label: "API keys" },
                { href: "/collections",        label: "My collections" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/4 border border-white/8 hover:bg-white/6 transition-colors text-white/60 hover:text-white text-sm">
                  {label} →
                </Link>
              ))}
            </div>
            {/* Analytics toggle */}
            {!showAnalytics && (
              <button
                onClick={loadAnalytics}
                disabled={analyticsLoading}
                className="w-full text-sm text-white/40 hover:text-white border border-white/8 hover:border-white/20 px-4 py-2.5 rounded-xl transition-colors"
              >
                {analyticsLoading ? "Loading analytics…" : "View profile analytics ↗"}
              </button>
            )}
          </div>
        )}
        {isOwner && showAnalytics && analytics && (
          <div className="mb-6">
            <ProfileAnalytics analytics={analytics} />
          </div>
        )}

        {/* Private account guard */}
        {!profile.isPublic && !isOwner ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-white/60 font-medium">This account is private</p>
            <p className="text-white/30 text-sm mt-1">Follow to see their posts and activity</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div role="tablist" className="flex gap-1 overflow-x-auto hide-scrollbar border-b border-white/8 mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-white text-white"
                      : "border-transparent text-white/40 hover:text-white/70"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "papers" && (
              likedLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
                </div>
              ) : likedCards.length === 0 ? (
                <p className="text-center text-white/30 text-sm py-12">No liked papers yet.</p>
              ) : (
                <div className="space-y-3">
                  {likedCards.map((card) => (
                    <div key={card.id} className="p-4 rounded-2xl bg-white/4 border border-white/8 hover:bg-white/6 transition-colors">
                      <p className="text-white font-semibold text-sm leading-snug mb-1 line-clamp-2">{card.headline}</p>
                      <p className="text-white/50 text-xs leading-relaxed line-clamp-2 mb-2">{card.hook}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {card.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="text-xs text-white/35 bg-white/5 px-2 py-0.5 rounded-full">#{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/25 text-xs">{card.readingTimeSeconds}s read</span>
                        {card.arxivUrl && (
                          <a href={card.arxivUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400/70 hover:text-blue-400 transition-colors">
                            Read paper ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === "videos" && (
              <p className="text-center text-white/30 text-sm py-12">No videos yet.</p>
            )}

            {activeTab === "about" && (
              <div className="space-y-4 py-2">
                {profile.bio && (
                  <div>
                    <p className="text-white/35 text-xs uppercase tracking-wide mb-1">Bio</p>
                    <p className="text-white/70 text-sm leading-relaxed">{profile.bio}</p>
                  </div>
                )}
                {profile.joinedAt && (
                  <div>
                    <p className="text-white/35 text-xs uppercase tracking-wide mb-1">Member since</p>
                    <p className="text-white/70 text-sm">{new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                  </div>
                )}
                {!profile.bio && !profile.joinedAt && (
                  <p className="text-center text-white/30 text-sm py-12">No info yet.</p>
                )}
              </div>
            )}

            {(activeTab === "followers" || activeTab === "following") && (
              <div className="space-y-2">
                {followListLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {(activeTab === "followers" ? followerUsers : followingUsers).map((u) => (
                      <FollowUserCard
                        key={u.userId}
                        user={u}
                        viewerUsername={session?.user?.name}
                        onFollowChange={() => loadFollowList(activeTab)}
                      />
                    ))}
                    {(activeTab === "followers" ? followerUsers : followingUsers).length === 0 && (
                      <p className="text-center text-white/30 text-sm py-12">
                        {activeTab === "followers" ? "No followers yet." : "Not following anyone yet."}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function ProfileAnalytics({ analytics }: { analytics: Analytics }) {
  const maxDay = Math.max(...analytics.viewsByDay.map((d) => d.count), 1);

  return (
    <div className="space-y-5 p-4 rounded-xl bg-white/3 border border-white/8">
      <p className="text-white/50 text-xs uppercase tracking-wide font-medium">Profile Analytics</p>

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
                    <div className="h-full bg-white/40 rounded-full" style={{ width: `${(c.count / maxCount) * 100}%` }} />
                  </div>
                  <span className="text-white/40 text-xs shrink-0 w-8 text-right">{c.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Devices</p>
        <div className="flex gap-3">
          {Object.entries(analytics.deviceBreakdown).filter(([, v]) => v > 0).map(([type, count]) => (
            <div key={type} className="flex-1 p-3 rounded-xl bg-white/4 border border-white/8 text-center">
              <p className="text-white font-semibold">{count}</p>
              <p className="text-white/35 text-xs mt-0.5 capitalize">{type}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

