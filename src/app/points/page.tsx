"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const DISCLAIMER = "Charta Alba Points have no monetary value and cannot be exchanged for cash or transferred to other users.";

const PURCHASE_DISCLAIMER =
  "Charta Alba Points are a virtual currency for use on the Charta Alba platform only. " +
  "Points have no monetary value, cannot be exchanged for cash, and are non-refundable after 48 hours or once spent. " +
  "Points expire after 12 months of account inactivity. " +
  "By purchasing points, you agree to our Terms of Service.";

const PACKAGES = [
  { key: "starter",  pts: 500,   price: "$4.99",  label: "Starter Pack",  badge: null },
  { key: "explorer", pts: 1500,  price: "$9.99",  label: "Explorer Pack", badge: "Best Value" },
  { key: "power",    pts: 5000,  price: "$24.99", label: "Power Pack",    badge: null },
  { key: "research", pts: 15000, price: "$59.99", label: "Research Pack", badge: null },
] as const;

const EARN_ACTIONS = [
  { label: "Post something today",           pts: 10,  type: "first_post_daily",        limit: "1/day" },
  { label: "Your post gets 10 likes",        pts: 25,  type: "post_milestone_10",        limit: "once/post" },
  { label: "Your post gets 50 likes",        pts: 75,  type: "post_milestone_50",        limit: "once/post" },
  { label: "Your post gets 100 likes",       pts: 150, type: "post_milestone_100",       limit: "once/post" },
  { label: "Comment on a paper",             pts: 2,   type: "comment_paper",            limit: "10/day" },
  { label: "3-day login streak",             pts: 15,  type: "login_streak_3",           limit: "per streak" },
  { label: "7-day login streak",             pts: 50,  type: "login_streak_7",           limit: "per streak" },
  { label: "30-day login streak",            pts: 200, type: "login_streak_30",          limit: "per streak" },
  { label: "Complete your profile",          pts: 25,  type: "profile_completed",        limit: "once" },
  { label: "Claim your first paper",         pts: 50,  type: "first_claim",              limit: "once" },
  { label: "Verify ORCID",                   pts: 100, type: "orcid_verified",           limit: "once" },
  { label: "Top 10 contributor (weekly)",    pts: 100, type: "top_contributor_weekly",   limit: "1/week" },
] as const;

const SPEND_ITEMS = [
  { key: "api_credits_500",    pts: 1000, label: "500 extra API requests" },
  { key: "api_credits_3000",   pts: 5000, label: "3,000 extra API requests" },
  { key: "boost_post_24h",     pts: 500,  label: "Boost post to top of feed (24h)" },
  { key: "badge_color_month",  pts: 200,  label: "Custom profile badge colour (1 month)" },
  { key: "extended_ask_ai",    pts: 300,  label: "50 extra Ask AI questions (1 month)" },
  { key: "early_access_month", pts: 1000, label: "Early access to new features (1 month)" },
  { key: "remove_ads_month",   pts: 400,  label: "Remove ads (1 month)" },
] as const;

interface LedgerRow {
  id: string;
  amount: number;
  transactionType: string;
  description: string;
  createdAt: string | null;
  runningBalance: number;
}

function DiamondIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2L2 9l10 13L22 9z" />
    </svg>
  );
}

function PointsDashboardInner() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [spending, setSpending] = useState<string | null>(null);
  const [spendError, setSpendError] = useState("");
  const [activeTab, setActiveTab] = useState<"earn" | "buy" | "spend" | "history">("earn");

  const successPkg = searchParams.get("success");

  const fetchBalance = useCallback(async () => {
    const res = await fetch("/api/points/balance");
    if (res.ok) {
      const d = await res.json() as { balance: number; history: LedgerRow[] };
      setBalance(d.balance);
      setHistory(d.history ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchBalance();
    if (status === "unauthenticated") setLoading(false);
  }, [status, fetchBalance]);

  async function handlePurchase(pkg: string) {
    setPurchasing(pkg);
    const res = await fetch("/api/points/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ package: pkg }),
    });
    setPurchasing(null);
    if (res.ok) {
      const d = await res.json() as { url?: string; devMode?: boolean; points?: number };
      if (d.url) { window.location.href = d.url; return; }
      if (d.devMode) { await fetchBalance(); }
    }
  }

  async function handleSpend(item: string) {
    setSpendError(""); setSpending(item);
    const res = await fetch("/api/points/spend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item }),
    });
    setSpending(null);
    if (res.ok) {
      await fetchBalance();
    } else {
      const d = await res.json() as { error?: string };
      setSpendError(d.error ?? "Failed to spend points.");
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
          <DiamondIcon className="text-amber-400 mx-auto w-10 h-10" />
          <h1 className="text-white text-xl font-bold">Charta Alba Points</h1>
          <p className="text-white/45 text-sm max-w-xs">Earn points by engaging with research. Sign in to get started.</p>
          <button onClick={() => signIn()} className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors">
            Sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Legal disclaimer — always visible */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/3 border border-white/6">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-white/30 mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p className="text-white/35 text-xs leading-relaxed">{DISCLAIMER}</p>
        </div>

        {/* Purchase success banner */}
        {successPkg === "purchased" && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            Points added to your balance!
          </div>
        )}

        {/* Balance hero */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/12 to-white/4 border border-amber-500/20 text-center">
          <DiamondIcon className="text-amber-400 mx-auto mb-2 w-8 h-8" />
          <p className="text-white/50 text-sm mb-1">Your balance</p>
          <p className="text-white text-5xl font-bold tracking-tight">
            {balance?.toLocaleString() ?? "—"}
          </p>
          <p className="text-white/30 text-xs mt-1">points</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/8">
          {(["earn", "buy", "spend", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === t ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              {t === "buy" ? "Buy" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Earn tab */}
        {activeTab === "earn" && (
          <div className="space-y-2">
            {EARN_ACTIONS.map((action) => (
              <div key={action.type} className="flex items-center justify-between p-3.5 rounded-xl bg-white/4 border border-white/8">
                <div>
                  <p className="text-white text-sm">{action.label}</p>
                  <p className="text-white/30 text-xs mt-0.5">{action.limit}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <DiamondIcon className="text-amber-400 w-3 h-3" />
                  <span className="text-amber-400 text-sm font-semibold">+{action.pts}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Buy tab */}
        {activeTab === "buy" && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              {PACKAGES.map((pkg) => (
                <div key={pkg.key} className="relative p-4 rounded-2xl bg-white/4 border border-white/8 flex flex-col gap-3">
                  {pkg.badge && (
                    <span className="absolute -top-2 left-4 text-xs bg-amber-400 text-black px-2 py-0.5 rounded-full font-semibold">
                      {pkg.badge}
                    </span>
                  )}
                  <div>
                    <p className="text-white font-semibold text-sm">{pkg.label}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <DiamondIcon className="text-amber-400 w-4 h-4" />
                      <span className="text-amber-400 font-bold text-lg">{pkg.pts.toLocaleString()}</span>
                      <span className="text-white/40 text-sm">points</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchase(pkg.key)}
                    disabled={purchasing !== null}
                    className="w-full py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors"
                  >
                    {purchasing === pkg.key ? "Redirecting…" : pkg.price}
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-white/3 border border-white/6">
              <p className="text-white/40 text-xs leading-relaxed">{PURCHASE_DISCLAIMER}</p>
            </div>
          </div>
        )}

        {/* Spend tab */}
        {activeTab === "spend" && (
          <div className="space-y-3">
            {spendError && <p className="text-red-400 text-sm">{spendError}</p>}
            {SPEND_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-white/4 border border-white/8">
                <div>
                  <p className="text-white text-sm">{item.label}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <DiamondIcon className="text-amber-400 w-3 h-3" />
                    <span className="text-amber-400 text-xs font-semibold">{item.pts.toLocaleString()} pts</span>
                  </div>
                </div>
                <button
                  onClick={() => handleSpend(item.key)}
                  disabled={spending !== null || (balance ?? 0) < item.pts}
                  className="px-3 py-1.5 rounded-lg bg-white/8 border border-white/10 text-white/70 text-xs font-semibold hover:bg-white/14 disabled:opacity-40 transition-colors shrink-0 ml-3"
                >
                  {spending === item.key ? "…" : "Redeem"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* History tab */}
        {activeTab === "history" && (
          <div className="space-y-1">
            {history.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-10">No transactions yet.</p>
            ) : (
              <>
                {/* Header */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 text-xs text-white/30 font-medium">
                  <span>Description</span>
                  <span className="text-right">Amount</span>
                  <span className="text-right w-20">Balance</span>
                </div>
                {history.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2.5 rounded-lg hover:bg-white/3 transition-colors"
                  >
                    <div>
                      <p className="text-white/80 text-sm leading-snug">{row.description}</p>
                      <p className="text-white/30 text-xs mt-0.5">
                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold self-center ${row.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                      {row.amount > 0 ? "+" : ""}{row.amount.toLocaleString()}
                    </span>
                    <span className="text-white/40 text-sm self-center text-right w-20">
                      {row.runningBalance.toLocaleString()}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-4 text-xs text-white/25 pt-2">
          <Link href="/terms#points" className="hover:text-white/50 transition-colors">Points Terms</Link>
          <Link href="/help" className="hover:text-white/50 transition-colors">Help</Link>
        </div>
      </div>
    </main>
  );
}

export default function PointsDashboard() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
      </main>
    }>
      <PointsDashboardInner />
    </Suspense>
  );
}
