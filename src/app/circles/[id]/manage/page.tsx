"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
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
}

interface Member {
  id: string;
  userId: string;
  role: string;
  joinedAt: string | null;
  name: string | null;
  image: string | null;
  username: string | null;
}

interface SearchUser {
  userId: string;
  username: string | null;
  name: string | null;
  image: string | null;
}

function Avatar({ url, name, size = 36 }: { url: string | null; name: string | null; size?: number }) {
  const dim = `${size}px`;
  const initials = (name ?? "?")[0].toUpperCase();
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name ?? ""} className="rounded-full object-cover shrink-0" style={{ width: dim, height: dim }} />;
  }
  return (
    <div className="rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white/60 font-medium" style={{ width: dim, height: dim, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

function RolePill({ role }: { role: string }) {
  if (role === "owner") return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/25">Owner</span>;
  if (role === "moderator") return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-500/20 text-violet-400 border border-violet-500/25">Mod</span>;
  return null;
}

type ManageTab = "members" | "settings";

export default function CircleManagePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ManageTab>("members");
  const [actionLoading, setActionLoading] = useState<string | null>(null); // userId of in-flight action

  // Settings form state
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Add-member search
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Load circle + members ──────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const [circleRes, membersRes] = await Promise.all([
      fetch(`/api/circles/${id}`),
      fetch(`/api/circles/${id}/members`),
    ]);
    if (!circleRes.ok) { setLoading(false); return; }
    const { circle: c } = await circleRes.json() as { circle: Circle };
    const { members: m } = await membersRes.json() as { members: Member[] };

    // inject owner role
    const membersWithOwner = m.map((mb) =>
      mb.userId === c.ownerId ? { ...mb, role: "owner" } : mb
    );
    // owner first, then mods, then members
    membersWithOwner.sort((a, b) => {
      const order = { owner: 0, moderator: 1, member: 2 };
      return (order[a.role as keyof typeof order] ?? 2) - (order[b.role as keyof typeof order] ?? 2);
    });

    setCircle(c);
    setMembers(membersWithOwner);
    setName(c.name);
    setDesc(c.description ?? "");
    setTagsInput(c.topicTags.join(", "));
    setAvatarUrl(c.avatarUrl ?? "");
    setIsPublic(c.isPublic);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (!loading && circle && session?.user?.id && circle.ownerId !== session.user.id) {
      router.replace(`/circles/${id}`);
    }
  }, [loading, circle, session?.user?.id, id, router]);

  // ── User search ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!searchQ.trim() || searchQ.length < 2) { setSearchResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      setSearchLoading(true);
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQ)}`);
      if (res.ok) {
        const d = await res.json() as { users: SearchUser[] };
        // Filter out existing members
        const existingIds = new Set(members.map((m) => m.userId));
        setSearchResults(d.users.filter((u) => !existingIds.has(u.userId)));
      }
      setSearchLoading(false);
    }, 300);
  }, [searchQ, members]);

  // ── Actions ────────────────────────────────────────────────────────────────
  async function addMember(user: SearchUser) {
    setAddingUserId(user.userId);
    // Join on behalf of the user isn't possible without impersonation — instead,
    // we insert a circleMembers row directly via the members POST endpoint.
    // The POST /members endpoint only allows self-join; we call it with a special
    // owner-add path on the members API.
    const res = await fetch(`/api/circles/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteUserId: user.userId }),
    });
    if (res.ok) {
      await loadData();
      setSearchQ("");
      setSearchResults([]);
    }
    setAddingUserId(null);
  }

  async function removeMember(userId: string) {
    setActionLoading(userId);
    await fetch(`/api/circles/${id}/members/${userId}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
    setCircle((prev) => prev ? { ...prev, memberCount: Math.max(prev.memberCount - 1, 0) } : prev);
    setActionLoading(null);
  }

  async function setRole(userId: string, role: "member" | "moderator") {
    setActionLoading(userId);
    const res = await fetch(`/api/circles/${id}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setMembers((prev) => prev.map((m) => m.userId === userId ? { ...m, role } : m));
    }
    setActionLoading(null);
  }

  async function saveSettings() {
    if (!name.trim()) return;
    setSaving(true);
    setSaveMsg(null);
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5);
    const res = await fetch(`/api/circles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: desc.trim() || null,
        topicTags: tags,
        avatarUrl: avatarUrl.trim() || null,
        isPublic,
      }),
    });
    if (res.ok) {
      const { circle: updated } = await res.json() as { circle: Circle };
      setCircle(updated);
      setSaveMsg("Saved");
    } else {
      setSaveMsg("Failed to save");
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(null), 2500);
  }

  async function deleteCircle() {
    setDeleting(true);
    const res = await fetch(`/api/circles/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.replace("/circles");
    } else {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading || status === "loading") {
    return (
      <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
      </main>
    );
  }

  if (!circle) {
    return (
      <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 text-sm">Circle not found.</p>
          <Link href="/circles" className="mt-3 inline-block text-sm text-white/40 hover:text-white underline">Back to Circles</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14 pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/circles/${id}`}
            className="flex items-center gap-1 text-white/40 hover:text-white text-sm transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            Back
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-semibold text-lg truncate">{circle.name}</h1>
            <p className="text-white/40 text-xs">Manage circle · {circle.memberCount} member{circle.memberCount !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/4 rounded-xl p-1">
          {(["members", "settings"] as ManageTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── MEMBERS TAB ──────────────────────────────────────────────── */}
        {tab === "members" && (
          <div className="space-y-6">

            {/* Add member */}
            <div>
              <p className="text-white/50 text-xs font-medium uppercase tracking-wide mb-2">Add Member</p>
              <div className="relative">
                <input
                  type="search"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search by username…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="mt-2 bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                  {searchResults.map((u) => (
                    <div key={u.userId} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/4 transition-colors">
                      <Avatar url={u.image} name={u.name} size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium leading-none">@{u.username}</p>
                        {u.name && <p className="text-white/40 text-xs mt-0.5 truncate">{u.name}</p>}
                      </div>
                      <button
                        onClick={() => addMember(u)}
                        disabled={addingUserId === u.userId}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10 text-white hover:bg-white/15 disabled:opacity-40 transition-colors"
                      >
                        {addingUserId === u.userId ? "Adding…" : "Add"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {searchQ.length >= 2 && !searchLoading && searchResults.length === 0 && (
                <p className="mt-2 text-white/30 text-xs pl-1">No users found matching &ldquo;{searchQ}&rdquo;</p>
              )}
            </div>

            {/* Member list */}
            <div>
              <p className="text-white/50 text-xs font-medium uppercase tracking-wide mb-2">
                Members ({members.length})
              </p>
              <div className="bg-[#111] border border-white/8 rounded-xl divide-y divide-white/5 overflow-hidden">
                {members.map((member) => {
                  const isOwner = member.userId === circle.ownerId;
                  const isSelf = member.userId === session?.user?.id;
                  const busy = actionLoading === member.userId;

                  return (
                    <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                      <Avatar url={member.image} name={member.name} size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {member.username ? (
                            <Link href={`/profile/${member.username}`} className="text-white text-sm font-medium hover:underline truncate">
                              @{member.username}
                            </Link>
                          ) : (
                            <span className="text-white/60 text-sm truncate">{member.name ?? "Unknown"}</span>
                          )}
                          <RolePill role={member.role} />
                          {isSelf && <span className="px-1.5 py-0.5 rounded text-[10px] text-white/30 border border-white/10">You</span>}
                        </div>
                        {member.joinedAt && (
                          <p className="text-white/30 text-xs mt-0.5">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Actions — only for non-owner, non-self members */}
                      {!isOwner && !isSelf && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Promote/demote toggle */}
                          <button
                            onClick={() => setRole(member.userId, member.role === "moderator" ? "member" : "moderator")}
                            disabled={busy}
                            title={member.role === "moderator" ? "Demote to member" : "Promote to moderator"}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 ${
                              member.role === "moderator"
                                ? "border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                                : "border-white/10 text-white/40 hover:text-white hover:bg-white/8"
                            }`}
                          >
                            {busy ? "…" : member.role === "moderator" ? "Demote" : "Mod"}
                          </button>

                          {/* Remove button */}
                          <button
                            onClick={() => removeMember(member.userId)}
                            disabled={busy}
                            title="Remove from circle"
                            className="px-2.5 py-1 rounded-lg text-xs font-medium border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/25 hover:bg-red-500/8 disabled:opacity-40 transition-colors"
                          >
                            {busy ? "…" : "Remove"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Danger zone */}
            <div className="border border-red-500/15 rounded-xl p-4">
              <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-1">Danger Zone</p>
              <p className="text-white/35 text-xs mb-3">Permanently delete this circle and all its messages, posts, and membership data. This cannot be undone.</p>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Delete Circle
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-red-400 text-sm font-medium">Are you sure?</p>
                  <button
                    onClick={deleteCircle}
                    disabled={deleting}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ─────────────────────────────────────────────── */}
        {tab === "settings" && (
          <div className="space-y-5">

            {/* Name */}
            <div>
              <label className="block text-white/50 text-xs font-medium uppercase tracking-wide mb-1.5">
                Circle Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-white/50 text-xs font-medium uppercase tracking-wide mb-1.5">Description</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                maxLength={300}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 resize-none transition-colors"
                placeholder="What is this circle about?"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-white/50 text-xs font-medium uppercase tracking-wide mb-1.5">
                Topic Tags
                <span className="normal-case font-normal text-white/25 ml-1">(comma-separated, max 5)</span>
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. cs.AI, LLMs, robotics"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors"
              />
              {tagsInput && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tagsInput.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-xs text-white/60">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Avatar URL */}
            <div>
              <label className="block text-white/50 text-xs font-medium uppercase tracking-wide mb-1.5">Avatar URL</label>
              <div className="flex items-center gap-3">
                {avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" />
                )}
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors"
                />
              </div>
            </div>

            {/* Visibility */}
            <div>
              <p className="text-white/50 text-xs font-medium uppercase tracking-wide mb-2">Visibility</p>
              <div className="flex gap-2">
                {[
                  { value: true,  label: "Public",  desc: "Anyone can discover and join" },
                  { value: false, label: "Private", desc: "Only invited members can join" },
                ].map(({ value, label, desc }) => (
                  <button
                    key={label}
                    onClick={() => setIsPublic(value)}
                    className={`flex-1 p-3 rounded-xl border text-left transition-colors ${
                      isPublic === value
                        ? "border-white/25 bg-white/8"
                        : "border-white/8 bg-white/3 hover:bg-white/5"
                    }`}
                  >
                    <p className={`text-sm font-medium ${isPublic === value ? "text-white" : "text-white/50"}`}>{label}</p>
                    <p className="text-white/30 text-xs mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Save */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={saveSettings}
                disabled={saving || !name.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/10 text-white hover:bg-white/15 disabled:opacity-40 transition-colors"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              {saveMsg && (
                <span className={`text-sm ${saveMsg === "Saved" ? "text-green-400" : "text-red-400"}`}>
                  {saveMsg}
                </span>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
