"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface FlaggedRow {
  id: string;
  userId: string;
  amount: number;
  transactionType: string;
  description: string;
  ipAddress: string | null;
  createdAt: string | null;
  userName: string | null;
  userEmail: string | null;
}

interface SuspiciousUser {
  userId: string;
  totalPts: number;
  eventCount: number;
  userName: string | null;
  userEmail: string | null;
}

export default function AdminPointsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [view, setView] = useState<"flagged" | "velocity">("flagged");
  const [flagged, setFlagged] = useState<FlaggedRow[]>([]);
  const [suspicious, setSuspicious] = useState<SuspiciousUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [voiding, setVoiding] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const fetchData = useCallback(async (v: "flagged" | "velocity") => {
    setLoading(true);
    const res = await fetch(`/api/admin/points?view=${v}`);
    if (res.ok) {
      const d = await res.json() as { flagged?: FlaggedRow[]; suspicious?: SuspiciousUser[] };
      if (v === "flagged") setFlagged(d.flagged ?? []);
      if (v === "velocity") setSuspicious(d.suspicious ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status === "authenticated") {
      if (session?.user?.role !== "admin") { router.push("/"); return; }
      fetchData(view);
    }
  }, [status, session, router, view, fetchData]);

  async function handleVoid(entryId: string) {
    if (!voidReason.trim()) { setMsg("Reason is required."); return; }
    setVoiding(entryId);
    const res = await fetch("/api/admin/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "void_entry", ledgerEntryId: entryId, reason: voidReason }),
    });
    setVoiding(null);
    if (res.ok) {
      setMsg("Entry voided.");
      setSelectedId(null);
      setVoidReason("");
      await fetchData(view);
    } else {
      const d = await res.json() as { error?: string };
      setMsg(d.error ?? "Failed to void.");
    }
  }

  if (status === "loading" || loading) {
    return (
      <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Points Anti-Fraud</h1>
            <p className="text-white/40 text-sm mt-0.5">Admin — review and void suspicious point awards</p>
          </div>
          <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">Admin Only</span>
        </div>

        {msg && (
          <div className={`p-3 rounded-lg text-sm ${msg.includes("voided") ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
            {msg}
          </div>
        )}

        {/* View tabs */}
        <div className="flex border-b border-white/8">
          {(["flagged", "velocity"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setView(t); fetchData(t); }}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                view === t ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              {t === "flagged" ? "Flagged entries" : "High-velocity users"}
            </button>
          ))}
        </div>

        {/* Flagged entries */}
        {view === "flagged" && (
          <div>
            {flagged.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-12">No flagged entries.</p>
            ) : (
              <div className="space-y-2">
                {flagged.map((row) => (
                  <div key={row.id} className="p-4 rounded-xl bg-red-500/5 border border-red-500/15">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-white text-sm font-medium">{row.userName ?? "Unknown"}</span>
                          <span className="text-white/40 text-xs">{row.userEmail}</span>
                          <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">FLAGGED</span>
                        </div>
                        <p className="text-white/60 text-sm">{row.description}</p>
                        <p className="text-white/30 text-xs mt-0.5">
                          Type: <code className="font-mono">{row.transactionType}</code>
                          {row.ipAddress && <> · IP: <code className="font-mono">{row.ipAddress}</code></>}
                          {row.createdAt && <> · {new Date(row.createdAt).toLocaleString("en")}</>}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-green-400 font-semibold text-sm">+{row.amount}</p>
                        <button
                          onClick={() => { setSelectedId(selectedId === row.id ? null : row.id); setMsg(""); }}
                          className="text-xs text-white/40 hover:text-red-400 transition-colors mt-1"
                        >
                          {selectedId === row.id ? "Cancel" : "Void"}
                        </button>
                      </div>
                    </div>

                    {selectedId === row.id && (
                      <div className="mt-3 pt-3 border-t border-white/8 flex gap-2">
                        <input
                          type="text"
                          value={voidReason}
                          onChange={(e) => setVoidReason(e.target.value)}
                          placeholder="Reason for void (required)"
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-white/20"
                        />
                        <button
                          onClick={() => handleVoid(row.id)}
                          disabled={voiding === row.id}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                        >
                          {voiding === row.id ? "Voiding…" : "Confirm Void"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* High-velocity users */}
        {view === "velocity" && (
          <div>
            {suspicious.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-12">No suspicious activity detected in the last hour.</p>
            ) : (
              <div className="space-y-2">
                {suspicious.map((user) => (
                  <div key={user.userId} className="flex items-center justify-between p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
                    <div>
                      <p className="text-white text-sm font-medium">{user.userName ?? "Unknown"}</p>
                      <p className="text-white/40 text-xs">{user.userEmail}</p>
                      <p className="text-white/30 text-xs mt-0.5">{user.eventCount} events this hour</p>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-400 font-bold text-lg">{user.totalPts.toLocaleString()}</p>
                      <p className="text-white/30 text-xs">pts/hour</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-white/20 text-xs pt-4 border-t border-white/6">
          Voiding inserts an offsetting negative ledger entry. Original rows are never deleted — audit trail is always preserved.
        </p>
      </div>
    </main>
  );
}
