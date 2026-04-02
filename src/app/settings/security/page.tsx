"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PasswordStrengthField, isPasswordValid } from "@/components/PasswordStrengthField";

interface LoginSession {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string | null;
}

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/8 pb-6 mb-6 last:border-b-0 last:mb-0 last:pb-0">
      <h2 className="text-white font-semibold text-sm mb-1">{title}</h2>
      {description && <p className="text-white/40 text-xs mb-4">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-white/25 transition-colors";

function Msg({ ok, text }: { ok: boolean; text: string }) {
  return <span className={`text-xs ${ok ? "text-green-400" : "text-red-400"}`}>{text}</span>;
}

export default function SecurityPage() {
  const { status } = useSession();
  const router = useRouter();

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [signOutAllLoading, setSignOutAllLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status !== "authenticated") return;

    fetch("/api/settings/sessions")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { sessions?: LoginSession[]; connectedProviders?: string[] } | null) => {
        setSessions(d?.sessions ?? []);
        setConnectedProviders(d?.connectedProviders ?? []);
      })
      .catch(() => undefined)
      .finally(() => setSessionsLoading(false));
  }, [status, router]);

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) { setPwMsg({ ok: false, text: "Passwords do not match." }); return; }
    if (!isPasswordValid(newPw)) { setPwMsg({ ok: false, text: "Password does not meet the strength requirements." }); return; }
    setPwLoading(true);
    const res = await fetch("/api/settings/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    setPwLoading(false);
    if (res.ok) {
      setPwMsg({ ok: true, text: "Password changed." });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } else {
      const d = await res.json() as { error?: string };
      setPwMsg({ ok: false, text: d.error ?? "Failed to change password." });
    }
  }

  async function handleSignOutAll() {
    setSignOutAllLoading(true);
    await fetch("/api/settings/sessions", { method: "DELETE" });
    setSignOutAllLoading(false);
    await signOut({ callbackUrl: "/auth/signin" });
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-xl">
      <div className="flex items-center gap-3 mb-6 md:hidden">
        <Link href="/settings" className="text-white/40 hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </Link>
        <h1 className="text-white text-xl font-bold">Security & Account Access</h1>
      </div>
      <h1 className="hidden md:block text-white text-xl font-bold mb-6">Security &amp; Account Access</h1>

      {/* Change password */}
      <Card title="Change password">
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Current password</label>
            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" className={inputCls} />
          </div>
          <PasswordStrengthField label="New password" value={newPw} onChange={setNewPw} autoComplete="new-password" />
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Confirm new password</label>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••" autoComplete="new-password" className={inputCls} />
          </div>
          <div className="flex items-center gap-4">
            <button type="submit" disabled={pwLoading} className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors">
              {pwLoading ? "Changing…" : "Change password"}
            </button>
            {pwMsg && <Msg ok={pwMsg.ok} text={pwMsg.text} />}
          </div>
        </form>
      </Card>

      {/* 2FA */}
      <Card title="Two-factor authentication" description="Add an extra layer of security to your account.">
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/4 border border-white/8">
          <div>
            <p className="text-white text-sm font-medium">Authenticator app</p>
            <p className="text-white/40 text-xs mt-0.5">TOTP support coming soon</p>
          </div>
          <span className="text-xs text-white/30 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">Coming soon</span>
        </div>
      </Card>

      {/* Login history */}
      <Card title="Login history" description="Your last 5 sign-in events.">
        {sessionsLoading ? (
          <div className="w-4 h-4 border-2 border-white/15 border-t-white/40 rounded-full animate-spin" />
        ) : sessions.length === 0 ? (
          <p className="text-white/30 text-sm">Login history is recorded from your next sign-in.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-start justify-between p-3 rounded-lg bg-white/4 border border-white/8">
                <div>
                  <p className="text-white/70 text-xs font-mono">{s.ipAddress ?? "Unknown IP"}</p>
                  <p className="text-white/30 text-xs mt-0.5 truncate max-w-xs">{s.userAgent ?? "Unknown device"}</p>
                </div>
                <p className="text-white/30 text-xs shrink-0 ml-3">
                  {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Connected accounts */}
      <Card title="Connected accounts" description="Third-party accounts linked to your Charta Alba profile.">
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/4 border border-white/8">
          <div className="flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
              <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 0 1 0-12.064 5.96 5.96 0 0 1 4.134 1.659l2.776-2.777A9.98 9.98 0 0 0 12.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
            </svg>
            <div>
              <p className="text-white text-sm font-medium">Google</p>
              <p className="text-white/40 text-xs">
                {connectedProviders.includes("google") ? "Connected" : "Not connected"}
              </p>
            </div>
          </div>
          {connectedProviders.includes("google") && (
            <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">Active</span>
          )}
        </div>
      </Card>

      {/* Sessions */}
      <Card title="Active sessions">
        <p className="text-white/40 text-sm mb-4">
          Signing out of all devices will end your current session. Full cross-device revocation requires server-side session management (coming in Phase 3).
        </p>
        <button
          onClick={handleSignOutAll}
          disabled={signOutAllLoading}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 disabled:opacity-50 transition-colors"
        >
          {signOutAllLoading ? "Signing out…" : "Sign out of all devices"}
        </button>
      </Card>
    </div>
  );
}
