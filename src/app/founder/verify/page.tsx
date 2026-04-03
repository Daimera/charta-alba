"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function FounderVerifyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
    if (status === "authenticated" && !session.user.isFounder) router.push("/");
    inputRef.current?.focus();
  }, [status, session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter exactly 6 digits.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/founder/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    setLoading(false);
    const data = await res.json() as {
      ok?: boolean;
      error?: string;
      attemptsLeft?: number;
      lockedUntil?: string;
    };

    if (data.ok) {
      router.push("/founder");
      return;
    }

    setError(data.error ?? "Verification failed.");
    if (data.attemptsLeft != null) setAttemptsLeft(data.attemptsLeft);
    if (data.lockedUntil) setLockedUntil(data.lockedUntil);
    setCode("");
    inputRef.current?.focus();
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-44px)]">
        <div className="w-5 h-5 border-2 border-red-900/30 border-t-red-500/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100dvh-44px)] px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Icon */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-red-400">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Founder Verification</h1>
            <p className="text-white/40 text-sm mt-1">
              Enter your 6-digit authenticator code
            </p>
          </div>
        </div>

        {/* Lockout warning */}
        {lockedUntil && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            Account locked until{" "}
            {new Date(lockedUntil).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}.
            <br />
            <span className="text-xs text-red-400/60 mt-1 block">
              Use a backup code to unlock immediately.
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              placeholder="000000"
              disabled={!!lockedUntil}
              className="w-full text-center text-2xl font-mono tracking-[0.5em] bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-red-500/40 focus:border-red-500/40 disabled:opacity-40 transition-colors"
            />
            {error && (
              <p className="text-red-400 text-sm text-center mt-2">{error}</p>
            )}
            {attemptsLeft != null && !lockedUntil && (
              <p className="text-amber-400/70 text-xs text-center mt-1">
                {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining before lockout
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6 || !!lockedUntil}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-semibold text-sm transition-colors"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-white/20 text-xs">
            Code expires every 30 seconds. Clock skew tolerance: ±30 s.
          </p>
          <a
            href="/founder/emergency-lock"
            className="text-red-500/40 hover:text-red-500/70 text-xs transition-colors"
          >
            Emergency lockdown
          </a>
        </div>
      </div>
    </div>
  );
}
