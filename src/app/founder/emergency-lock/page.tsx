"use client";

import { useState } from "react";
import { EMERGENCY_PHRASE } from "@/lib/founder-constants";

export default function EmergencyLockPage() {
  const [phrase, setPhrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [lockedUntil, setLockedUntil] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/founder/emergency-lock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phrase }),
    });

    setLoading(false);
    const data = await res.json() as { ok?: boolean; error?: string; lockedUntil?: string; message?: string };

    if (data.ok) {
      setLockedUntil(data.lockedUntil ?? "");
      setDone(true);
      return;
    }

    setError(data.error ?? "Failed.");
  }

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-44px)] px-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-red-400">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 className="text-white text-xl font-bold">Account Locked</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            The founder account has been locked. All active sessions are invalidated.
          </p>
          {lockedUntil && (
            <p className="text-red-400/70 text-xs font-mono">
              Locked until: {new Date(lockedUntil).toUTCString()}
            </p>
          )}
          <p className="text-white/30 text-xs leading-relaxed">
            To restore access, use one of your backup codes at{" "}
            <span className="text-white/50 font-mono">/founder/verify</span>.
            An alert has been sent to the founder email address.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100dvh-44px)] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-red-500">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h1 className="text-red-400 font-bold text-lg">Emergency Lockdown</h1>
            <p className="text-white/40 text-sm mt-1 leading-relaxed">
              This will immediately lock the founder account and invalidate all sessions.
              No authentication required.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-red-500/8 border border-red-500/20">
          <p className="text-white/60 text-xs leading-relaxed">
            Type the emergency phrase exactly to activate lockdown:
          </p>
          <p className="text-red-400/80 text-xs font-mono mt-2 select-all">{EMERGENCY_PHRASE}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={phrase}
            onChange={(e) => { setPhrase(e.target.value); setError(""); }}
            placeholder="Type exact phrase above…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-red-500/40 focus:border-red-500/40 transition-colors font-mono"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || phrase.trim() !== EMERGENCY_PHRASE}
            className="w-full py-3 rounded-xl bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white font-bold text-sm transition-colors"
          >
            {loading ? "Locking…" : "Activate Emergency Lock"}
          </button>
        </form>

        <p className="text-white/20 text-xs text-center">
          This page is accessible without authentication by design.
        </p>
      </div>
    </div>
  );
}
