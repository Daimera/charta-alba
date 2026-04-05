"use client";

import { useState, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerifyTwoFAInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const clean = code.replace(/\s/g, "");
    if (clean.length < 6) { setError("Enter the 6-digit code from your authenticator app."); return; }

    setLoading(true);
    const res = await fetch("/api/auth/2fa/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: clean }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };
    if (data.ok) {
      router.push(callbackUrl);
    } else {
      setError(data.error ?? "Invalid code. Try again.");
      setCode("");
      inputRef.current?.focus();
    }
    setLoading(false);
  }

  return (
    <main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center px-4" id="main-content">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-white/8 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-white text-xl font-bold">Two-Factor Authentication</h1>
          <p className="text-white/45 text-sm mt-2">
            Enter the 6-digit code from your authenticator app, or use a backup code.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="totp-code" className="sr-only">Authentication code</label>
            <input
              id="totp-code"
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8} // 6 digits or backup code
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="000 000"
              required
              autoFocus
              className="w-full bg-white/5 border border-white/12 rounded-xl px-4 py-3 text-white text-center text-2xl font-mono tracking-[0.5em] placeholder-white/20 focus:outline-none focus:border-white/30"
            />
          </div>

          {error && <p role="alert" className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || code.replace(/\s/g, "").length < 6}
            className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
        </form>

        <p className="text-white/25 text-xs text-center">
          Lost your phone? Enter one of your backup codes above.
        </p>
      </div>
    </main>
  );
}

export default function VerifyTwoFAPage() {
  return (
    <Suspense fallback={null}>
      <VerifyTwoFAInner />
    </Suspense>
  );
}
