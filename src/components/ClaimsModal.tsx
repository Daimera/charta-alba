"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";

interface ClaimsModalProps {
  paperId: string;
  paperTitle: string | null;
  onClose: () => void;
}

interface Claim {
  id: string;
  email: string;
  orcidId: string | null;
  status: string;
  createdAt: string;
}

export function ClaimsModal({ paperId, paperTitle, onClose }: ClaimsModalProps) {
  const { data: session } = useSession();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [orcidId, setOrcidId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/cards/${paperId}/claims`)
      .then((r) => r.json())
      .then((d) => setClaims(d.claims ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [paperId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/cards/${paperId}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), orcidId: orcidId.trim() || null }),
      });
      if (res.ok) setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "text-yellow-400 bg-yellow-400/10",
      verified: "text-green-400 bg-green-400/10",
      rejected: "text-red-400 bg-red-400/10",
    };
    return map[status] ?? "text-white/40 bg-white/5";
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 fade-in" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-[#111111] border border-white/10 rounded-2xl max-w-sm mx-auto overflow-hidden fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <h2 className="text-white font-semibold text-sm">Claim this paper</h2>
            {paperTitle && (
              <p className="text-white/40 text-xs mt-0.5 truncate max-w-52">{paperTitle}</p>
            )}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[60dvh] overflow-y-auto">
          {/* Existing claims */}
          {!loading && claims.length > 0 && (
            <div>
              <p className="text-white/40 text-xs font-medium uppercase tracking-wide mb-2">
                Existing claims
              </p>
              <div className="space-y-2">
                {claims.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between bg-white/4 rounded-xl px-3 py-2"
                  >
                    <div>
                      <p className="text-white/70 text-xs">{c.email}</p>
                      {c.orcidId && (
                        <p className="text-white/30 text-xs">{c.orcidId}</p>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Claim form */}
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </div>
              <p className="text-white text-sm font-semibold">Claim submitted</p>
              <p className="text-white/40 text-xs mt-1">We&apos;ll review your request.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <p className="text-white/60 text-xs leading-relaxed">
                Are you an author of this paper? Verify your identity below and we&apos;ll review your claim.
              </p>
              <div>
                <label className="text-white/50 text-xs block mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@institution.edu"
                  required
                  className="w-full bg-white/8 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-white/25"
                />
              </div>
              <div>
                <label className="text-white/50 text-xs block mb-1">ORCID iD (optional)</label>
                <input
                  type="text"
                  value={orcidId}
                  onChange={(e) => setOrcidId(e.target.value)}
                  placeholder="0000-0000-0000-0000"
                  className="w-full bg-white/8 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-white/25"
                />
              </div>
              {!session && (
                <p className="text-white/40 text-xs">
                  <button
                    type="button"
                    onClick={() => signIn()}
                    className="text-white/60 underline hover:text-white/80"
                  >
                    Sign in
                  </button>{" "}
                  to link the claim to your account.
                </p>
              )}
              <button
                type="submit"
                disabled={!email.trim() || submitting}
                className="w-full py-2.5 rounded-xl bg-white text-black text-sm font-semibold disabled:opacity-40 hover:bg-white/90 transition-colors"
              >
                {submitting ? "Submitting…" : "Submit Claim"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
