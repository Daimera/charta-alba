"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

interface Post {
  id: string;
  content: string | null;
  type: string;
  createdAt: string | null;
  userId: string;
  authorName: string | null;
  authorImage: string | null;
}

interface Member {
  id: string;
  userId: string;
  role: string;
  name: string | null;
  image: string | null;
}

function Avatar({ name, image, size = 8 }: { name: string | null; image: string | null; size?: number }) {
  const sz = `w-${size} h-${size}`;
  if (image) return <img src={image} alt={name ?? ""} className={`${sz} rounded-full object-cover`} />;  // eslint-disable-line @next/next/no-img-element
  return (
    <div className={`${sz} rounded-full bg-white/15 flex items-center justify-center text-xs text-white font-medium shrink-0`}>
      {(name ?? "?")[0].toUpperCase()}
    </div>
  );
}

export default function CircleDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: session } = useSession();
  const router = useRouter();

  const [circle, setCircle] = useState<Circle | null>(null);
  const [membership, setMembership] = useState<{ role: string } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tab, setTab] = useState<"posts" | "members">("posts");
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);

  const [postContent, setPostContent] = useState("");
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [circleRes, postsRes, membersRes] = await Promise.all([
      fetch(`/api/circles/${id}`),
      fetch(`/api/circles/${id}/posts`),
      fetch(`/api/circles/${id}/members`),
    ]);

    if (!circleRes.ok) { router.push("/circles"); return; }

    const [circleData, postsData, membersData] = await Promise.all([
      circleRes.json() as Promise<{ circle: Circle; membership: { role: string } | null }>,
      postsRes.ok ? postsRes.json() as Promise<{ posts: Post[] }> : Promise.resolve({ posts: [] }),
      membersRes.ok ? membersRes.json() as Promise<{ members: Member[] }> : Promise.resolve({ members: [] }),
    ]);

    setCircle(circleData.circle);
    setMembership(circleData.membership);
    setPosts(postsData.posts);
    setMembers(membersData.members);
    setLoading(false);
  }, [id, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleJoin() {
    if (!session?.user) { router.push("/auth/signin"); return; }
    setJoinLoading(true);
    const res = await fetch(`/api/circles/${id}/members`, { method: "POST" });
    setJoinLoading(false);
    if (res.ok) fetchData();
  }

  async function handleLeave() {
    setJoinLoading(true);
    const res = await fetch(`/api/circles/${id}/members`, { method: "DELETE" });
    setJoinLoading(false);
    if (res.ok) fetchData();
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!postContent.trim()) return;
    setPostError(""); setPostLoading(true);
    const res = await fetch(`/api/circles/${id}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: postContent.trim(), type: "discussion" }),
    });
    setPostLoading(false);
    if (res.ok) {
      const d = await res.json() as { post: Post & { authorName?: string; authorImage?: string } };
      const newPost: Post = {
        ...d.post,
        authorName: session?.user?.name ?? null,
        authorImage: session?.user?.image ?? null,
      };
      setPosts((prev) => [newPost, ...prev]);
      setPostContent("");
    } else {
      const d = await res.json() as { error?: string };
      setPostError(d.error ?? "Failed to post.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
      </main>
    );
  }

  if (!circle) return null;

  const isOwner = session?.user?.id === circle.ownerId;
  const isMember = !!membership;

  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back */}
        <Link href="/circles" className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors mb-5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Circles
        </Link>

        {/* Circle header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center text-white font-bold text-xl shrink-0">
            {circle.avatarUrl
              ? <img src={circle.avatarUrl} alt={circle.name} className="w-16 h-16 rounded-2xl object-cover" />  // eslint-disable-line @next/next/no-img-element
              : circle.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-white text-xl font-bold leading-tight">{circle.name}</h1>
                <p className="text-white/40 text-sm mt-0.5">{circle.memberCount} member{circle.memberCount !== 1 ? "s" : ""} · {circle.isPublic ? "Public" : "Private"}</p>
              </div>
              {!isOwner && (
                <button
                  onClick={isMember ? handleLeave : handleJoin}
                  disabled={joinLoading}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
                    isMember
                      ? "bg-white/8 border border-white/10 text-white/70 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                      : "bg-white text-black hover:bg-white/90"
                  } disabled:opacity-50`}
                >
                  {joinLoading ? "…" : isMember ? "Leave" : "Join"}
                </button>
              )}
              {isOwner && (
                <span className="text-xs text-white/30 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full shrink-0">Owner</span>
              )}
            </div>
            {circle.description && <p className="text-white/50 text-sm mt-2">{circle.description}</p>}
            {circle.topicTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {circle.topicTags.map((t) => (
                  <span key={t} className="text-xs text-white/40 bg-white/5 px-2.5 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/8 mb-5">
          {(["posts", "members"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                tab === t ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              {t} {t === "members" && `(${members.length})`}
            </button>
          ))}
        </div>

        {tab === "posts" && (
          <div className="space-y-4">
            {/* New post form — members only */}
            {isMember && (
              <form onSubmit={handlePost} className="bg-white/4 border border-white/8 rounded-2xl p-4 space-y-3">
                <div className="flex gap-3">
                  <Avatar name={session?.user?.name ?? null} image={session?.user?.image ?? null} />
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Share something with the Circle…"
                    rows={3}
                    maxLength={2000}
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none resize-none"
                  />
                </div>
                {postError && <p className="text-red-400 text-xs">{postError}</p>}
                <div className="flex justify-end">
                  <button type="submit" disabled={postLoading || !postContent.trim()} className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors">
                    {postLoading ? "Posting…" : "Post"}
                  </button>
                </div>
              </form>
            )}

            {/* Posts list */}
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/30 text-sm">{isMember ? "Be the first to post in this Circle." : "Join to see and post in this Circle."}</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white/4 border border-white/8 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={post.authorName} image={post.authorImage} />
                    <div>
                      <p className="text-white text-sm font-medium">{post.authorName ?? "Unknown"}</p>
                      <p className="text-white/30 text-xs">
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </p>
                    </div>
                  </div>
                  <p className="text-white/80 text-sm whitespace-pre-wrap">{post.content}</p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "members" && (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/4 transition-colors">
                <Avatar name={m.name} image={m.image} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{m.name ?? "Unknown"}</p>
                </div>
                {m.role !== "member" && (
                  <span className="text-xs text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full capitalize">{m.role}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
