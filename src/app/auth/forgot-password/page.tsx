"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthLogo } from "@/components/AuthLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setSubmitted(true);
  }

  return (
    <main className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center px-4 pt-14">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <AuthLogo />
          <h1 className="text-white text-2xl font-bold tracking-tight">Reset password</h1>
          <p className="text-white/40 text-sm mt-1">
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>

        <div className="bg-white/4 border border-white/8 rounded-2xl p-6">
          {submitted ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-white text-sm font-medium">Check your inbox</p>
              <p className="text-white/40 text-sm">
                If an account exists for <span className="text-white/60">{email}</span>, you&apos;ll receive a reset link shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/25 focus:bg-white/8 transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
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
