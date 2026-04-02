"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-b-0">
      <div>
        <p className="text-white/80 text-sm">{label}</p>
        {description && <p className="text-white/35 text-xs mt-0.5">{description}</p>}
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

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [emailDigest, setEmailDigest] = useState(false);
  const [emailComments, setEmailComments] = useState(false);
  const [emailNewFollower, setEmailNewFollower] = useState(false);
  const [emailReply, setEmailReply] = useState(false);
  const [emailBreakthrough, setEmailBreakthrough] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [pushStatus, setPushStatus] = useState<"default" | "granted" | "denied">("default");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status !== "authenticated") return;

    if (typeof window !== "undefined" && "Notification" in window) {
      setPushStatus(Notification.permission as "default" | "granted" | "denied");
    }

    fetch("/api/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { profile?: { emailDigest?: boolean; emailComments?: boolean; emailNewFollower?: boolean; emailReply?: boolean; emailBreakthrough?: boolean } | null } | null) => {
        if (!d?.profile) return;
        setEmailDigest(d.profile.emailDigest ?? false);
        setEmailComments(d.profile.emailComments ?? false);
        setEmailNewFollower(d.profile.emailNewFollower ?? false);
        setEmailReply(d.profile.emailReply ?? false);
        setEmailBreakthrough(d.profile.emailBreakthrough ?? false);
      })
      .catch(() => undefined);
  }, [status, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const res = await fetch("/api/settings/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailDigest, emailComments, emailNewFollower, emailReply, emailBreakthrough }),
    });
    setLoading(false);
    if (res.ok) setMsg({ ok: true, text: "Preferences saved." });
    else { const d = await res.json() as { error?: string }; setMsg({ ok: false, text: d.error ?? "Failed to save." }); }
  }

  async function requestPush() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setPushStatus(permission as "default" | "granted" | "denied");
    if (permission === "granted") {
      new Notification("Charta Alba notifications are now active!", {
        body: "You'll be notified about breakthrough papers and activity.",
        icon: "/favicon.ico",
      });
    }
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
        <h1 className="text-white text-xl font-bold">Notifications</h1>
      </div>
      <h1 className="hidden md:block text-white text-xl font-bold mb-6">Notifications</h1>

      {/* Push */}
      <div className="border-b border-white/8 pb-6 mb-6">
        <h2 className="text-white font-semibold text-sm mb-1">Push notifications</h2>
        <p className="text-white/40 text-xs mb-4">Receive alerts in your browser even when Charta Alba isn&apos;t open.</p>
        {pushStatus === "granted" ? (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            Notifications enabled
          </div>
        ) : pushStatus === "denied" ? (
          <div className="space-y-2">
            <p className="text-red-400 text-sm">Notifications are blocked.</p>
            <p className="text-white/40 text-xs">Go to your browser settings → Site settings → Notifications → Allow for this site.</p>
          </div>
        ) : (
          <button
            onClick={requestPush}
            className="px-4 py-2 rounded-lg bg-white/8 border border-white/10 text-sm text-white/80 hover:bg-white/12 transition-colors"
          >
            Enable notifications
          </button>
        )}
      </div>

      {/* Email */}
      <div>
        <h2 className="text-white font-semibold text-sm mb-1">Email notifications</h2>
        <p className="text-white/40 text-xs mb-4">All off by default — only enable what matters to you.</p>
        <form onSubmit={handleSave}>
          <div className="space-y-0">
            <Toggle checked={emailNewFollower} onChange={setEmailNewFollower} label="New follower" />
            <Toggle checked={emailComments} onChange={setEmailComments} label="Comment on your post" />
            <Toggle checked={emailReply} onChange={setEmailReply} label="Reply to your comment" />
            <Toggle checked={emailDigest} onChange={setEmailDigest} label="Weekly digest" description="Top papers from the past week." />
            <Toggle checked={emailBreakthrough} onChange={setEmailBreakthrough} label="Breakthrough alerts" description="New top-ranked paper in your topics." />
          </div>
          <div className="flex items-center gap-4 mt-5">
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors">
              {loading ? "Saving…" : "Save preferences"}
            </button>
            {msg && <Msg ok={msg.ok} text={msg.text} />}
          </div>
        </form>
      </div>
    </div>
  );
}
