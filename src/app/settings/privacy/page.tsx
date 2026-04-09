"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MutedKeyword { id: string; keyword: string; }

const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-white/25 transition-colors";
const selectCls = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25 transition-colors appearance-none";

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/8 pb-6 mb-6 last:border-b-0 last:mb-0 last:pb-0">
      <h2 className="text-white font-semibold text-sm mb-1">{title}</h2>
      {description && <p className="text-white/40 text-xs mb-4">{description}</p>}
      {!description && <div className="mb-3" />}
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-white text-sm">{label}</p>
        {description && <p className="text-white/40 text-xs mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${checked ? "bg-white" : "bg-white/20"}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function Msg({ ok, text }: { ok: boolean; text: string }) {
  return <span className={`text-xs ${ok ? "text-green-400" : "text-red-400"}`}>{text}</span>;
}

export default function PrivacyPage() {
  const { status } = useSession();
  const router = useRouter();

  const [isPublic, setIsPublic] = useState(true);
  const [commentPermission, setCommentPermission] = useState("everyone");
  const [dmPermission, setDmPermission] = useState("everyone");
  const [markSensitive, setMarkSensitive] = useState(false);
  const [hiddenReplies, setHiddenReplies] = useState(false);
  const [privacyMsg, setPrivacyMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [privacyLoading, setPrivacyLoading] = useState(false);

  const [keywords, setKeywords] = useState<MutedKeyword[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [kwLoading, setKwLoading] = useState(false);
  const [kwMsg, setKwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status !== "authenticated") return;

    fetch("/api/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { profile?: { isPublic?: boolean; commentPermission?: string; dmPermission?: string; markSensitive?: boolean; hiddenReplies?: boolean } | null } | null) => {
        if (!d?.profile) return;
        setIsPublic(d.profile.isPublic ?? true);
        setCommentPermission(d.profile.commentPermission ?? "everyone");
        setDmPermission(d.profile.dmPermission ?? "everyone");
        setMarkSensitive(d.profile.markSensitive ?? false);
        setHiddenReplies(d.profile.hiddenReplies ?? false);
      })
      .catch(() => undefined);

    fetch("/api/settings/muted-keywords")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { keywords?: MutedKeyword[] } | null) => setKeywords(d?.keywords ?? []))
      .catch(() => undefined);
  }, [status, router]);

  async function savePrivacy(overrides?: Record<string, unknown>) {
    setPrivacyMsg(null);
    setPrivacyLoading(true);
    const res = await fetch("/api/settings/privacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic, commentPermission, dmPermission, markSensitive, hiddenReplies, ...overrides }),
    });
    setPrivacyLoading(false);
    if (res.ok) setPrivacyMsg({ ok: true, text: "Saved." });
    else { const d = await res.json() as { error?: string }; setPrivacyMsg({ ok: false, text: d.error ?? "Failed to save." }); }
  }

  async function addKeyword(e: React.FormEvent) {
    e.preventDefault();
    const kw = newKeyword.trim().toLowerCase();
    if (!kw) return;
    setKwLoading(true); setKwMsg(null);
    const res = await fetch("/api/settings/muted-keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: kw }),
    });
    setKwLoading(false);
    if (res.ok) {
      const d = await res.json() as { keyword?: MutedKeyword };
      if (d.keyword && !keywords.find((k) => k.id === d.keyword!.id)) {
        setKeywords((prev) => [...prev, d.keyword!]);
      }
      setNewKeyword(""); setKwMsg({ ok: true, text: `"${kw}" muted.` });
    } else {
      const d = await res.json() as { error?: string }; setKwMsg({ ok: false, text: d.error ?? "Failed." });
    }
  }

  async function removeKeyword(keyword: string) {
    await fetch("/api/settings/muted-keywords", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword }),
    });
    setKeywords((prev) => prev.filter((k) => k.keyword !== keyword));
  }

  if (status === "loading") {
    return <div className="flex items-center justify-center py-20"><div className="w-5 h-5 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-xl">
      <div className="flex items-center gap-3 mb-6 md:hidden">
        <Link href="/settings" className="text-white/40 hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </Link>
        <h1 className="text-white text-xl font-bold">Privacy & Safety</h1>
      </div>
      <h1 className="hidden md:block text-white text-xl font-bold mb-6">Privacy &amp; Safety</h1>

      {/* Audience & visibility */}
      <Card title="Audience & visibility">
        <div className="space-y-1 mb-4">
          <Toggle
            label="Private account"
            description="Only approved followers can see your posts."
            checked={!isPublic}
            onChange={(v) => setIsPublic(!v)}
          />
          <div className="pt-1">
            <label className="block text-xs text-white/50 mb-1.5">Who can comment on your posts</label>
            <select value={commentPermission} onChange={(e) => setCommentPermission(e.target.value)} className={selectCls}>
              <option value="everyone">Everyone</option>
              <option value="followers">Followers only</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>
          <div className="pt-2">
            <label className="block text-xs text-white/50 mb-1.5">Who can send you direct messages</label>
            <select value={dmPermission} onChange={(e) => setDmPermission(e.target.value)} className={selectCls}>
              <option value="everyone">Everyone</option>
              <option value="followers">Followers only</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4 pt-1">
          <button onClick={() => savePrivacy()} disabled={privacyLoading} className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors">
            {privacyLoading ? "Saving…" : "Save"}
          </button>
          {privacyMsg && <Msg ok={privacyMsg.ok} text={privacyMsg.text} />}
        </div>
      </Card>

      {/* Content */}
      <Card title="Content" description="Control how your content appears to others.">
        <div className="space-y-1">
          <Toggle
            label="Mark my uploads as sensitive by default"
            description="Adds a content warning to your posts."
            checked={markSensitive}
            onChange={async (v) => { setMarkSensitive(v); await savePrivacy({ markSensitive: v }); }}
          />
          <Toggle
            label="Hide replies to my posts"
            description="Replies will be collapsed by default."
            checked={hiddenReplies}
            onChange={async (v) => { setHiddenReplies(v); await savePrivacy({ hiddenReplies: v }); }}
          />
        </div>
      </Card>

      {/* Muted keywords */}
      <Card title="Muted keywords" description="Posts containing these words are hidden from your feed.">
        <form onSubmit={addKeyword} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Add keyword…"
            maxLength={100}
            className={`${inputCls} flex-1`}
          />
          <button type="submit" disabled={kwLoading || !newKeyword.trim()} className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-sm text-white hover:bg-white/15 disabled:opacity-50 transition-colors shrink-0">
            Add
          </button>
        </form>
        {kwMsg && <div className="mb-3"><Msg ok={kwMsg.ok} text={kwMsg.text} /></div>}
        {keywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {keywords.map((k) => (
              <span key={k.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 text-sm text-white/70">
                {k.keyword}
                <button onClick={() => removeKeyword(k.keyword)} className="text-white/30 hover:text-white/70 transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-sm">No muted keywords.</p>
        )}
      </Card>

      {/* Blocked users */}
      <Card title="Blocked accounts" description="People you have blocked cannot interact with your account.">
        <div className="p-4 rounded-xl bg-white/4 border border-white/8 text-center">
          <p className="text-white/40 text-sm">Block management coming soon.</p>
        </div>
      </Card>
    </div>
  );
}
