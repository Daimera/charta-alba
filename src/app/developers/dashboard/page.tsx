"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  tier: string;
  requestsThisMonth: number;
  requestsToday: number;
  lastUsedAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface NewKeyResult extends ApiKey {
  rawKey: string;
}

interface UsageDay {
  day: string;
  requests: number;
}

const TIER_MONTHLY = { free: 1000, starter: 10000, pro: 100000, enterprise: -1 };
const TIER_LABELS: Record<string, string> = { free: "Free", starter: "Starter", pro: "Pro", enterprise: "Enterprise" };

function UsageBar({ days }: { days: UsageDay[] }) {
  if (!days.length) return null;
  const max = Math.max(...days.map((d) => d.requests), 1);
  const barW = 6;
  const gap = 2;
  const h = 64;
  const totalW = days.length * (barW + gap) - gap;

  return (
    <svg width={totalW} height={h + 20} className="overflow-visible">
      {days.map((d, i) => {
        const barH = Math.max(2, Math.round((d.requests / max) * h));
        const x = i * (barW + gap);
        const y = h - barH;
        return (
          <g key={d.day}>
            <rect x={x} y={y} width={barW} height={barH} rx="1" className="fill-white/30" />
            {i % 7 === 0 && (
              <text x={x + barW / 2} y={h + 14} textAnchor="middle" className="fill-white/20" fontSize="8">
                {d.day.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    free: "text-white/40 bg-white/5 border-white/10",
    starter: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    pro: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    enterprise: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[tier] ?? colors.free}`}>
      {TIER_LABELS[tier] ?? tier}
    </span>
  );
}

function DashboardInner() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [usageDays, setUsageDays] = useState<UsageDay[]>([]);
  const [totalThisMonth, setTotalThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<NewKeyResult | null>(null);
  const [createError, setCreateError] = useState("");
  const [revoking, setRevoking] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const successMsg = searchParams.get("success");

  const fetchData = useCallback(async () => {
    const [keysRes, usageRes] = await Promise.all([
      fetch("/api/developers/keys"),
      fetch("/api/developers/usage"),
    ]);
    if (keysRes.ok) {
      const d = await keysRes.json() as { keys: ApiKey[] };
      setKeys(d.keys);
    }
    if (usageRes.ok) {
      const d = await usageRes.json() as { days: UsageDay[]; totalThisMonth: number };
      setUsageDays(d.days ?? []);
      setTotalThisMonth(d.totalThisMonth ?? 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchData();
    if (status === "unauthenticated") setLoading(false);
  }, [status, fetchData]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreateError(""); setCreating(true);
    const res = await fetch("/api/developers/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setCreating(false);
    if (res.ok) {
      const d = await res.json() as { key: NewKeyResult };
      setNewKey(d.key);
      setShowCreate(false);
      setNewName("");
      await fetchData();
    } else {
      const d = await res.json() as { error?: string };
      setCreateError(d.error ?? "Failed to create key.");
    }
  }

  async function handleRevoke(id: string) {
    setRevoking(id);
    await fetch(`/api/developers/keys/${id}`, { method: "DELETE" });
    setRevoking(null);
    await fetchData();
  }

  async function handleUpgrade(tier: "starter" | "pro") {
    setUpgrading(tier);
    const res = await fetch("/api/developers/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
    setUpgrading(null);
    if (res.ok) {
      const d = await res.json() as { url?: string };
      if (d.url) window.location.href = d.url;
    }
  }

  if (status === "loading" || loading) {
    return (
      <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <h1 className="text-white text-xl font-bold">Developer Dashboard</h1>
          <p className="text-white/45 text-sm">Sign in to create and manage your API keys.</p>
          <button
            onClick={() => signIn()}
            className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            Sign in
          </button>
        </div>
      </main>
    );
  }

  const highestTier = keys.length > 0
    ? (["enterprise", "pro", "starter", "free"].find((t) => keys.some((k) => k.tier === t)) ?? "free")
    : "free";
  const monthlyLimit = TIER_MONTHLY[highestTier as keyof typeof TIER_MONTHLY] ?? 1000;

  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Developer Dashboard</h1>
            <p className="text-white/40 text-sm mt-0.5">Manage your API keys and monitor usage</p>
          </div>
          <Link href="/developers/docs" className="text-white/40 hover:text-white text-sm transition-colors">
            API Docs →
          </Link>
        </div>

        {/* Success banner */}
        {successMsg === "upgraded" && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            Plan upgraded successfully! Your new limits are active.
          </div>
        )}

        {/* New key reveal */}
        {newKey && (
          <div className="p-5 rounded-2xl bg-amber-500/8 border border-amber-500/20 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-amber-400 font-semibold text-sm">Your new API key — copy it now</p>
                <p className="text-amber-400/60 text-xs mt-0.5">This key will never be shown again.</p>
              </div>
              <button onClick={() => setNewKey(null)} className="text-white/30 hover:text-white transition-colors text-lg leading-none">×</button>
            </div>
            <code className="block bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white font-mono break-all select-all">
              {newKey.rawKey}
            </code>
            <button
              onClick={() => { navigator.clipboard.writeText(newKey.rawKey); }}
              className="px-4 py-2 rounded-lg bg-white/8 border border-white/10 text-white/70 text-xs hover:bg-white/12 transition-colors"
            >
              Copy to clipboard
            </button>
          </div>
        )}

        {/* Monthly usage summary */}
        <div className="p-5 rounded-2xl bg-white/4 border border-white/8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white font-semibold text-sm">Monthly usage</p>
              <p className="text-white/40 text-xs mt-0.5">
                {totalThisMonth.toLocaleString()} / {monthlyLimit === -1 ? "Unlimited" : monthlyLimit.toLocaleString()} requests
              </p>
            </div>
            <TierBadge tier={highestTier} />
          </div>
          {monthlyLimit !== -1 && (
            <div className="w-full h-2 rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/60 transition-all"
                style={{ width: `${Math.min(100, (totalThisMonth / monthlyLimit) * 100).toFixed(1)}%` }}
              />
            </div>
          )}
          {highestTier === "free" && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleUpgrade("starter")}
                disabled={upgrading !== null}
                className="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors"
              >
                {upgrading === "starter" ? "Redirecting…" : "Upgrade to Starter — $49/mo"}
              </button>
              <button
                onClick={() => handleUpgrade("pro")}
                disabled={upgrading !== null}
                className="px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-400 text-xs font-semibold hover:bg-violet-500/30 disabled:opacity-50 transition-colors"
              >
                {upgrading === "pro" ? "Redirecting…" : "Upgrade to Pro — $199/mo"}
              </button>
            </div>
          )}
        </div>

        {/* Usage chart */}
        {usageDays.some((d) => d.requests > 0) && (
          <div className="p-5 rounded-2xl bg-white/4 border border-white/8">
            <p className="text-white font-semibold text-sm mb-4">Requests — last 30 days</p>
            <div className="overflow-x-auto">
              <UsageBar days={usageDays} />
            </div>
          </div>
        )}

        {/* API Keys */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold text-sm">API Keys</h2>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              New Key
            </button>
          </div>

          {showCreate && (
            <form onSubmit={handleCreate} className="mb-4 p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
              <div>
                <label className="block text-xs text-white/50 mb-1">Key name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Production, My App"
                  maxLength={50}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              {createError && <p className="text-red-400 text-xs">{createError}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={creating} className="px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors">
                  {creating ? "Creating…" : "Create key"}
                </button>
                <button type="button" onClick={() => { setShowCreate(false); setNewName(""); setCreateError(""); }} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs hover:bg-white/8 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {keys.length === 0 ? (
            <div className="text-center py-10 text-white/30 text-sm">
              No API keys yet. Create one to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className={`p-4 rounded-xl border ${key.isActive ? "bg-white/4 border-white/8" : "bg-white/2 border-white/5 opacity-50"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white text-sm font-medium">{key.name}</p>
                        <TierBadge tier={key.tier} />
                        {!key.isActive && (
                          <span className="text-xs text-red-400/70 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">Revoked</span>
                        )}
                      </div>
                      <code className="text-white/30 text-xs font-mono">{key.keyPrefix}••••••••</code>
                    </div>
                    {key.isActive && (
                      <button
                        onClick={() => handleRevoke(key.id)}
                        disabled={revoking === key.id}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 text-xs hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 disabled:opacity-50 transition-colors"
                      >
                        {revoking === key.id ? "…" : "Revoke"}
                      </button>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2.5 text-xs text-white/30">
                    <span>{key.requestsThisMonth.toLocaleString()} this month</span>
                    <span>{key.requestsToday.toLocaleString()} today</span>
                    {key.lastUsedAt && (
                      <span>Last used {new Date(key.lastUsedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer links */}
        <div className="flex gap-4 text-xs text-white/30 pt-2">
          <Link href="/developers" className="hover:text-white/60 transition-colors">API Landing</Link>
          <Link href="/developers/docs" className="hover:text-white/60 transition-colors">Documentation</Link>
          <Link href="/developers/terms" className="hover:text-white/60 transition-colors">API Terms</Link>
        </div>
      </div>
    </main>
  );
}

export default function DeveloperDashboard() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
      </main>
    }>
      <DashboardInner />
    </Suspense>
  );
}
