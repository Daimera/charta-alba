"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
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

interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: string | null;
  name: string | null;
  image: string | null;
  username: string | null;
}

interface Message {
  id: string;
  content: string;
  message_type: string;
  media_url: string | null;
  created_at: string | null;
  user_id: string;
  author_name: string | null;
  author_image: string | null;
  author_username: string | null;
}

type CircleTab = "chat" | "papers" | "media" | "members";

function UserAvatar({ url, name, size = 36 }: { url: string | null; name: string | null; size?: number }) {
  const dim = `${size}px`;
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name ?? ""} className="rounded-full object-cover shrink-0" style={{ width: dim, height: dim }} />;
  }
  return (
    <div
      className="rounded-full bg-white/15 flex items-center justify-center text-white font-semibold shrink-0"
      style={{ width: dim, height: dim, fontSize: size / 2.5 }}
    >
      {(name ?? "?")[0].toUpperCase()}
    </div>
  );
}

function CircleAvatar({ circle, size = 56 }: { circle: Circle; size?: number }) {
  const dim = `${size}px`;
  if (circle.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={circle.avatarUrl} alt={circle.name} className="rounded-xl object-cover shrink-0" style={{ width: dim, height: dim }} />;
  }
  const colors = ["bg-violet-500/30", "bg-blue-500/30", "bg-green-500/30", "bg-amber-500/30", "bg-red-500/30"];
  const color = colors[circle.name.charCodeAt(0) % colors.length];
  return (
    <div className={`rounded-xl ${color} flex items-center justify-center text-white font-bold shrink-0`}
      style={{ width: dim, height: dim, fontSize: size / 3 }}>
      {circle.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function CirclePage() {
  const params = useParams<{ id: string }>();
  const circleId = params.id;
  const { data: session } = useSession();
  const router = useRouter();

  const [circle, setCircle] = useState<Circle | null>(null);
  const [membership, setMembership] = useState<{ role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<CircleTab>("chat");

  // Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMsgIdRef = useRef<string | null>(null);

  // Members
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);

  // Load circle
  useEffect(() => {
    fetch(`/api/circles/${circleId}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.ok ? r.json() : null;
      })
      .then((d: { circle: Circle; membership: { role: string } | null } | null) => {
        if (d) { setCircle(d.circle); setMembership(d.membership); }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [circleId]);

  // Load + poll messages when on chat tab and is member
  const loadMessages = useCallback(async () => {
    if (!session?.user?.id || !membership) return;
    try {
      const res = await fetch(`/api/circles/${circleId}/messages`);
      if (!res.ok) return;
      const d = await res.json() as { messages: Message[] };
      setMessages(d.messages);
      const last = d.messages[d.messages.length - 1]?.id ?? null;
      if (last && last !== lastMsgIdRef.current) {
        lastMsgIdRef.current = last;
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch { /* ignore */ }
  }, [circleId, session?.user?.id, membership]);

  useEffect(() => {
    if (activeTab !== "chat" || !membership) return;
    loadMessages();
    pollRef.current = setInterval(loadMessages, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeTab, loadMessages, membership]);

  useEffect(() => {
    if (activeTab === "members" && !membersLoaded) {
      fetch(`/api/circles/${circleId}/members`)
        .then(r => r.ok ? r.json() : null)
        .then((d: { members: Member[] } | null) => {
          if (d) setMembers(d.members);
          setMembersLoaded(true);
        })
        .catch(() => undefined);
    }
  }, [activeTab, circleId, membersLoaded]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!msgInput.trim() || sending) return;
    const content = msgInput.trim();
    setMsgInput("");
    setSending(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const d = await res.json() as { message: Message };
        setMessages(prev => [...prev, d.message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleJoin() {
    if (!session?.user) { signIn(); return; }
    const res = await fetch(`/api/circles/${circleId}/join`, { method: "POST" });
    if (res.ok) {
      setMembership({ role: "member" });
      setCircle(prev => prev ? { ...prev, memberCount: prev.memberCount + 1 } : prev);
    }
  }

  async function handleLeave() {
    const res = await fetch(`/api/circles/${circleId}/join`, { method: "DELETE" });
    if (res.ok) router.push("/circles");
  }

  if (loading) return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
    </main>
  );

  if (notFound || !circle) return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex items-center justify-center">
      <div className="text-center">
        <p className="text-white font-semibold">Circle not found</p>
        <Link href="/circles" className="text-white/40 text-sm hover:text-white mt-2 block">← Back to Circles</Link>
      </div>
    </main>
  );

  const isOwner = session?.user?.id === circle.ownerId;
  const isMember = !!membership;
  const whereby_room = `https://whereby.com/charta-alba-${circleId}`;

  const tabs: { id: CircleTab; label: string }[] = [
    { id: "chat",    label: "Chat" },
    { id: "papers",  label: "Papers" },
    { id: "media",   label: "Media" },
    { id: "members", label: `Members (${circle.memberCount})` },
  ];

  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col px-4 py-6">

        <Link href="/circles" className="flex items-center gap-1.5 text-white/35 hover:text-white text-sm mb-4 w-fit transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Circles
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <CircleAvatar circle={circle} size={56} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-white font-bold text-xl leading-tight">{circle.name}</h1>
                <p className="text-white/35 text-xs mt-0.5">{circle.memberCount} member{circle.memberCount !== 1 ? "s" : ""} · {circle.isPublic ? "Public" : "Private"}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isMember && (
                  <a href={whereby_room} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400 hover:bg-green-500/18 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.899L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                    </svg>
                    Call
                  </a>
                )}
                {!isMember && circle.isPublic && (
                  <button onClick={handleJoin} className="px-4 py-1.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors">
                    Join
                  </button>
                )}
                {isMember && !isOwner && (
                  <button onClick={handleLeave} className="px-3 py-1.5 rounded-lg border border-white/12 text-xs text-white/50 hover:border-red-500/30 hover:text-red-400 transition-colors">
                    Leave
                  </button>
                )}
                {isOwner && (
                  <Link href={`/circles/${circleId}/manage`} className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 hover:bg-amber-500/18 transition-colors">
                    Manage
                  </Link>
                )}
              </div>
            </div>
            {circle.description && <p className="text-white/50 text-sm mt-1.5 leading-relaxed">{circle.description}</p>}
            {circle.topicTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {circle.topicTags.map((tag) => (
                  <span key={tag} className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Not-a-member gate */}
        {!isMember ? (
          <div className="flex-1 flex items-center justify-center py-16 text-center">
            <div>
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/25">
                  <circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v8" />
                </svg>
              </div>
              {circle.isPublic ? (
                <>
                  <p className="text-white/60 text-sm mb-3">Join this circle to see the chat and shared papers.</p>
                  <button onClick={handleJoin} className="px-6 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors">
                    Join Circle
                  </button>
                </>
              ) : (
                <p className="text-white/40 text-sm">This is a private circle — request an invitation to join.</p>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div role="tablist" className="flex border-b border-white/8 mb-4">
              {tabs.map((tab) => (
                <button key={tab.id} role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0 ${
                    activeTab === tab.id ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/70"
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* CHAT */}
            {activeTab === "chat" && (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto space-y-4 pb-2" style={{ maxHeight: "calc(100dvh - 360px)" }}>
                  {messages.length === 0 ? (
                    <p className="text-center text-white/30 text-sm py-12">No messages yet. Say hello!</p>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.user_id === session?.user?.id;
                      return (
                        <div key={msg.id} className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}>
                          <UserAvatar url={msg.author_image} name={msg.author_name} size={32} />
                          <div className={`max-w-[75%] flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
                            {!isOwn && (
                              <p className="text-white/35 text-xs px-1">
                                {msg.author_username ? `@${msg.author_username}` : (msg.author_name ?? "Unknown")}
                              </p>
                            )}
                            <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                              isOwn ? "bg-white text-black rounded-br-sm" : "bg-white/8 text-white/85 rounded-bl-sm"
                            }`}>
                              {msg.content}
                            </div>
                            <p className="text-white/20 text-xs px-1">{timeAgo(msg.created_at)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={sendMessage} className="flex gap-2 mt-3 pt-3 border-t border-white/8">
                  <input
                    type="text"
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    placeholder="Message the circle…"
                    maxLength={2000}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
                  />
                  <button type="submit" disabled={sending || !msgInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-40 transition-colors shrink-0">
                    {sending ? "…" : "Send"}
                  </button>
                </form>
              </div>
            )}

            {/* PAPERS */}
            {activeTab === "papers" && (
              <div className="text-center py-12">
                <p className="text-white/30 text-sm">No papers shared yet.</p>
                <p className="text-white/20 text-xs mt-1">Bookmark any feed card and choose &ldquo;Post to Circle&rdquo; to share here.</p>
              </div>
            )}

            {/* MEDIA */}
            {activeTab === "media" && (
              <div className="text-center py-12">
                <p className="text-white/30 text-sm">No media shared yet.</p>
              </div>
            )}

            {/* MEMBERS */}
            {activeTab === "members" && (
              <div className="space-y-2">
                {!membersLoaded ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
                  </div>
                ) : members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/6">
                    <UserAvatar url={m.image} name={m.name} size={40} />
                    <div className="flex-1 min-w-0">
                      <Link href={m.username ? `/profile/${m.username}` : "#"}
                        className="block text-white text-sm font-medium truncate hover:text-white/80 transition-colors">
                        {m.name ?? "Unknown"}
                      </Link>
                      {m.username && <p className="text-white/35 text-xs">@{m.username}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {m.role !== "member" && (
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          m.role === "owner"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-white/5 text-white/40 border border-white/10"
                        }`}>{m.role}</span>
                      )}
                      <p className="text-white/20 text-xs">{timeAgo(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
