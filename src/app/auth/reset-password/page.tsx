"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PasswordStrengthField, isPasswordValid } from "@/components/PasswordStrengthField";
import { PasswordInput } from "@/components/PasswordInput";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const passwordsMatch = confirm === password;

  if (!token) {
    return (
      <div className="text-center space-y-2">
        <p className="text-red-400 text-sm">Invalid reset link.</p>
        <Link href="/auth/forgot-password" className="text-white/60 hover:text-white text-sm transition-colors">
          Request a new one
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isPasswordValid(password)) {
      setError("Password does not meet the strength requirements.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json() as { error?: string; expired?: boolean };
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/auth/signin"), 2000);
  }

  if (done) {
    return (
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-white text-sm font-medium">Password updated!</p>
        <p className="text-white/40 text-sm">Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm space-y-2">
          <p>{error}</p>
          {error.toLowerCase().includes("expired") && (
            <Link
              href="/auth/forgot-password"
              className="inline-block text-xs text-red-300 underline hover:text-red-200 transition-colors"
            >
              Request a new link →
            </Link>
          )}
        </div>
      )}
      <PasswordStrengthField
        label="New password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
      />
      <div>
        <label className="block text-sm text-white/60 mb-1.5">Confirm password</label>
        <PasswordInput
          value={confirm}
          onChange={(v) => { setConfirm(v); if (!confirmTouched) setConfirmTouched(true); }}
          autoComplete="new-password"
          required
        />
        {confirmTouched && confirm.length > 0 && (
          <p style={{ marginTop: "6px", fontSize: "13px" }}>
            {passwordsMatch
              ? <span style={{ color: "#22c55e" }}>✓ Passwords match</span>
              : <span style={{ color: "#ef4444" }}>✗ Passwords don&apos;t match</span>
            }
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading || (confirmTouched && !passwordsMatch)}
        className="w-full py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center px-4 pt-14">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-white text-2xl font-bold tracking-tight">Set new password</h1>
          <p className="text-white/40 text-sm mt-1">Choose a strong password</p>
        </div>

        <div className="bg-white/4 border border-white/8 rounded-2xl p-6">
          <Suspense fallback={null}>
            <ResetForm />
          </Suspense>
        </div>

        <p className="text-center text-sm text-white/40 mt-5">
          <Link href="/auth/signin" className="text-white/70 hover:text-white transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
