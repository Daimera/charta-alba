"use client";

import { useState, useEffect, useCallback } from "react";
import { CRITICAL_PHRASE } from "@/lib/founder-constants";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StatusData {
  users: { total: number };
  papers: { total: number };
  apiKeys: { total: number; active: number };
  points: { totalAwarded: number; totalPurchased: number };
  security: { failedLoginsLast24h: number; suspiciousPointFlags: number };
  generatedAt: string;
}

interface UserRow {
  id: string; name: string | null; email: string;
  role: string; isFounder: boolean; createdAt: string | null; isActive: boolean | null;
}

interface ApiKeyRow {
  id: string; keyPrefix: string; tier: string; isActive: boolean;
  requestsToday: number | null; createdAt: string | null; lastUsedAt: string | null;
  userName: string | null; userEmail: string | null; userId: string;
}

interface LedgerRow {
  id: string; userId: string; amount: number; transactionType: string;
  description: string; isFlagged: boolean; ipAddress: string | null;
  createdAt: string | null; userName: string | null; userEmail: string | null;
}

interface AuditRow {
  id: string; actionType: string; targetType: string | null; targetId: string | null;
  detail: Record<string, unknown> | null; ipAddress: string | null;
  verificationLevel: number; totpVerified: boolean; createdAt: string | null;
}

interface ConfigRow { key: string; value: unknown; description: string | null; updatedAt: string | null }
interface FlagRow { key: string; enabled: boolean; description: string | null; updatedAt: string | null }

// ── Helpers ───────────────────────────────────────────────────────────────────

type Tab = "overview" | "users" | "apikeys" | "points" | "config" | "audit";

function StatCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: string
}) {
  return (
    <div className={`p-4 rounded-xl border ${accent ?? "bg-white/4 border-white/8"}`}>
      <p className="text-white/40 text-xs uppercase tracking-wide">{label}</p>
      <p className="text-white text-2xl font-bold mt-1 tabular-nums">{value}</p>
      {sub && <p className="text-white/30 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function Badge({ text, variant }: { text: string; variant: "red" | "green" | "amber" | "blue" }) {
  const cls = {
    red:   "bg-red-500/10 border-red-500/20 text-red-400",
    green: "bg-green-500/10 border-green-500/20 text-green-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    blue:  "bg-blue-500/10 border-blue-500/20 text-blue-400",
  }[variant];
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${cls}`}>{text}</span>
  );
}

// ── Confirmation modal (Level 3 actions) ─────────────────────────────────────

function ConfirmModal({
  title, description, onConfirm, onCancel, loading,
}: {
  title: string; description: string;
  onConfirm: (phrase: string) => void;
  onCancel: () => void; loading: boolean;
}) {
  const [phrase, setPhrase] = useState("");
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0e0e10] border border-white/10 rounded-2xl p-6 space-y-4">
        <h3 className="text-white font-bold">{title}</h3>
        <p className="text-white/50 text-sm">{description}</p>
        <div>
          <p className="text-white/30 text-xs mb-1.5">Type the confirmation phrase exactly:</p>
          <p className="text-amber-400/70 text-xs font-mono mb-3 select-all">{CRITICAL_PHRASE}</p>
          <input
            type="text"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="Confirmation phrase…"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-amber-500/40 font-mono"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(phrase)}
            disabled={loading || phrase.trim() !== CRITICAL_PHRASE}
            className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
          >
            {loading ? "Processing…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Security Events panel ─────────────────────────────────────────────────────

const SECURITY_TYPES = new Set([
  "auth_failed",
  "auth_locked",
  "rate_limited",
  "forbidden_access",
  "founder_access_attempt",
  "api_key_new_ip",
]);

function SecurityEvents({ rows }: { rows: AuditRow[] }) {
  const day24Ago = Date.now() - 86400_000;
  const secRows = rows.filter((r) => SECURITY_TYPES.has(r.actionType));
  const recent = secRows.filter((r) => r.createdAt && new Date(r.createdAt).getTime() > day24Ago);

  // Group failed logins by IP in last 24h
  const failedByIp = new Map<string, number>();
  for (const r of recent.filter((r) => r.actionType === "auth_failed")) {
    const ip = r.ipAddress ?? "unknown";
    failedByIp.set(ip, (failedByIp.get(ip) ?? 0) + 1);
  }
  const topIps = [...failedByIp.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const lockedCount = recent.filter((r) => r.actionType === "auth_locked").length;
  const rateLimitCount = recent.filter((r) => r.actionType === "rate_limited").length;
  const forbiddenCount = recent.filter((r) => r.actionType === "forbidden_access").length;
  const founderAttempts = recent.filter((r) => r.actionType === "founder_access_attempt").length;

  if (secRows.length === 0) return null;

  return (
    <div className="p-4 rounded-xl border border-amber-500/15 bg-amber-500/4 space-y-3">
      <p className="text-amber-400/80 text-xs uppercase tracking-wide font-mono">Security Events — last 24h</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Failed logins", value: recent.filter((r) => r.actionType === "auth_failed").length, warn: true },
          { label: "Locked accounts", value: lockedCount, warn: lockedCount > 0 },
          { label: "Rate limited", value: rateLimitCount, warn: rateLimitCount > 5 },
          { label: "/founder attempts", value: founderAttempts, warn: founderAttempts > 0 },
        ].map((s) => (
          <div key={s.label} className={`p-2.5 rounded-lg text-center border ${s.warn && s.value > 0 ? "border-amber-500/25 bg-amber-500/8" : "border-white/6 bg-white/3"}`}>
            <p className={`font-bold text-lg tabular-nums ${s.warn && s.value > 0 ? "text-amber-400" : "text-white/60"}`}>{s.value}</p>
            <p className="text-white/30 text-xs">{s.label}</p>
          </div>
        ))}
      </div>
      {topIps.length > 0 && (
        <div>
          <p className="text-white/30 text-xs font-mono mb-1.5">Top IPs with failed logins (24h)</p>
          <div className="space-y-1">
            {topIps.map(([ip, count]) => (
              <div key={ip} className="flex items-center justify-between">
                <span className="text-white/40 text-xs font-mono">{ip}</span>
                <span className="text-amber-400/70 text-xs tabular-nums">{count} attempts</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {forbiddenCount > 0 && (
        <p className="text-red-400/60 text-xs font-mono">{forbiddenCount} forbidden access attempts in last 24h</p>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function FounderDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"ok" | "err">("ok");

  // Data state
  const [status, setStatus] = useState<StatusData | null>(null);
  const [userList, setUserList] = useState<UserRow[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [apiKeyList, setApiKeyList] = useState<ApiKeyRow[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [configRows, setConfigRows] = useState<ConfigRow[]>([]);
  const [flagRows, setFlagRows] = useState<FlagRow[]>([]);
  const [founderKey, setFounderKey] = useState<{ keyPrefix: string; createdAt: string; lastUsedAt: string | null } | null>(null);

  // Loading state per tab
  const [loadingTab, setLoadingTab] = useState(false);

  // Confirm modal state
  const [confirmAction, setConfirmAction] = useState<null | {
    title: string; description: string;
    execute: (phrase: string) => Promise<void>;
  }>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Points award form
  const [awardUserId, setAwardUserId] = useState("");
  const [awardAmount, setAwardAmount] = useState("");
  const [awardReason, setAwardReason] = useState("");

  function notify(text: string, type: "ok" | "err" = "ok") {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(""), 4000);
  }

  async function apiFetch(url: string, opts?: RequestInit) {
    const res = await fetch(url, opts);
    if (!res.ok) {
      const d = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(d.error ?? `HTTP ${res.status}`);
    }
    return res.json();
  }

  const loadTab = useCallback(async (t: Tab) => {
    setLoadingTab(true);
    try {
      if (t === "overview") {
        const d = await apiFetch("/api/founder/status") as StatusData;
        setStatus(d);
        const k = await apiFetch("/api/founder/api-key") as { key: typeof founderKey };
        setFounderKey(k.key);
      }
      if (t === "users") {
        const d = await apiFetch("/api/founder/users") as { users: UserRow[] };
        setUserList(d.users);
      }
      if (t === "apikeys") {
        const d = await apiFetch("/api/founder/api-keys") as { keys: ApiKeyRow[] };
        setApiKeyList(d.keys);
      }
      if (t === "points") {
        const d = await apiFetch("/api/founder/points") as { rows: LedgerRow[] };
        setLedger(d.rows);
      }
      if (t === "config") {
        const d = await apiFetch("/api/founder/config") as { config: ConfigRow[]; flags: FlagRow[] };
        setConfigRows(d.config);
        setFlagRows(d.flags);
      }
      if (t === "audit") {
        const d = await apiFetch("/api/founder/audit") as { rows: AuditRow[] };
        setAuditRows(d.rows);
      }
    } catch (e) {
      notify((e as Error).message, "err");
    }
    setLoadingTab(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadTab(tab); }, [tab, loadTab]);

  // User search
  useEffect(() => {
    if (tab !== "users") return;
    const t = setTimeout(async () => {
      try {
        const url = userSearch ? `/api/founder/users?q=${encodeURIComponent(userSearch)}` : "/api/founder/users";
        const d = await apiFetch(url) as { users: UserRow[] };
        setUserList(d.users);
      } catch { /* silent */ }
    }, 350);
    return () => clearTimeout(t);
  }, [userSearch, tab]);

  function triggerConfirm(
    title: string,
    description: string,
    execute: (confirmPhrase: string) => Promise<void>,
  ) {
    setConfirmAction({ title, description, execute });
  }

  async function handleConfirm(phrase: string) {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      await confirmAction.execute(phrase);
      notify("Action completed.");
    } catch (e) {
      notify((e as Error).message, "err");
    }
    setConfirmLoading(false);
    setConfirmAction(null);
  }

  async function userAction(userId: string, action: string, extra?: Record<string, unknown>) {
    const payload = { action, userId, confirmPhrase: CRITICAL_PHRASE, ...extra };
    await apiFetch("/api/founder/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await loadTab("users");
  }

  async function rotateFounderKey() {
    const d = await apiFetch("/api/founder/api-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmPhrase: CRITICAL_PHRASE }),
    }) as { key: string; prefix: string };
    notify(`New key generated. COPY NOW — shown once:\n${d.key}`, "ok");
    await loadTab("overview");
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "users",    label: "Users" },
    { id: "apikeys",  label: "API Keys" },
    { id: "points",   label: "Points" },
    { id: "config",   label: "Config" },
    { id: "audit",    label: "Audit Log" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold font-mono">Founder Console</h1>
          <p className="text-white/25 text-xs mt-0.5 font-mono">
            Level 2 verified · 15-min window · All actions are audited
          </p>
        </div>
        <a
          href="/founder/emergency-lock"
          className="text-xs text-red-500/50 hover:text-red-500 border border-red-900/30 hover:border-red-700/40 px-2.5 py-1 rounded-lg transition-colors font-mono"
        >
          Emergency Lock
        </a>
      </div>

      {/* Global message */}
      {msg && (
        <div className={`p-3 rounded-xl text-sm font-mono whitespace-pre-wrap ${
          msgType === "ok"
            ? "bg-green-500/8 border border-green-500/20 text-green-400"
            : "bg-red-500/8 border border-red-500/20 text-red-400"
        }`}>
          {msg}
        </div>
      )}

      {/* Confirm modal */}
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.title}
          description={confirmAction.description}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
          loading={confirmLoading}
        />
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-0 border-b border-white/8">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-medium font-mono whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-red-500 text-red-400"
                : "border-transparent text-white/35 hover:text-white/60"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loadingTab && (
        <div className="flex justify-center py-10">
          <div className="w-5 h-5 border-2 border-red-900/30 border-t-red-500/60 rounded-full animate-spin" />
        </div>
      )}

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      {tab === "overview" && !loadingTab && status && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Users" value={status.users.total.toLocaleString()} />
            <StatCard label="Papers" value={status.papers.total.toLocaleString()} />
            <StatCard label="API Keys" value={status.apiKeys.total} sub={`${status.apiKeys.active} active`} />
            <StatCard label="Pts Awarded" value={status.points.totalAwarded.toLocaleString()} />
            <StatCard
              label="Failed Logins 24h"
              value={status.security.failedLoginsLast24h}
              accent={status.security.failedLoginsLast24h > 5
                ? "bg-red-500/8 border-red-500/20"
                : "bg-white/4 border-white/8"}
            />
            <StatCard
              label="Flagged Points"
              value={status.security.suspiciousPointFlags}
              accent={status.security.suspiciousPointFlags > 0
                ? "bg-amber-500/8 border-amber-500/20"
                : "bg-white/4 border-white/8"}
            />
          </div>

          {/* Founder API Key */}
          <div className="p-5 rounded-2xl bg-white/3 border border-white/8 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-semibold">Founder API Key</p>
                <p className="text-white/30 text-xs mt-0.5">
                  No rate limits. All requests logged to audit trail.
                </p>
              </div>
              <button
                onClick={() => triggerConfirm(
                  "Rotate Founder API Key",
                  "The current key will be immediately invalidated. You must save the new key — it will only be shown once.",
                  async () => rotateFounderKey(),
                )}
                className="text-xs text-red-400/70 hover:text-red-400 border border-red-900/30 hover:border-red-700/40 px-2.5 py-1 rounded-lg transition-colors"
              >
                Rotate Key
              </button>
            </div>
            {founderKey ? (
              <div className="font-mono text-xs text-white/50 bg-black/40 rounded-lg px-3 py-2 border border-white/6">
                {founderKey.keyPrefix}… · Created {founderKey.createdAt
                  ? new Date(founderKey.createdAt).toLocaleDateString()
                  : "—"}
                {founderKey.lastUsedAt && ` · Last used ${new Date(founderKey.lastUsedAt).toLocaleDateString()}`}
              </div>
            ) : (
              <p className="text-white/25 text-xs">No active key. Generate one above.</p>
            )}
          </div>

          {/* Export links */}
          <div className="space-y-2">
            <p className="text-white/30 text-xs uppercase tracking-wide font-mono">Exports</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Papers CSV", type: "papers" },
                { label: "Users CSV (anonymized)", type: "users" },
                { label: "Audit Log CSV", type: "audit" },
              ].map((e) => (
                <a
                  key={e.type}
                  href={`/api/founder/export?type=${e.type}`}
                  download
                  className="text-xs text-white/40 hover:text-white/70 border border-white/8 hover:border-white/15 px-3 py-1.5 rounded-lg transition-colors font-mono"
                >
                  {e.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── USERS ────────────────────────────────────────────────────────── */}
      {tab === "users" && !loadingTab && (
        <div className="space-y-4">
          <input
            type="search"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search by email or name…"
            className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-red-500/30 font-mono"
          />

          <div className="space-y-1.5">
            {userList.length === 0 && (
              <p className="text-white/25 text-sm text-center py-8">No users found.</p>
            )}
            {userList.map((u) => (
              <div key={u.id} className="p-3.5 rounded-xl bg-white/3 border border-white/7 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-white text-sm font-medium truncate">{u.name ?? "—"}</span>
                      <span className="text-white/35 text-xs font-mono truncate">{u.email}</span>
                      {u.isFounder && <Badge text="FOUNDER" variant="red" />}
                      {u.role !== "user" && <Badge text={u.role.toUpperCase()} variant="amber" />}
                      {u.isActive === false && <Badge text="SUSPENDED" variant="red" />}
                    </div>
                    <p className="text-white/25 text-xs font-mono mt-0.5">{u.id}</p>
                  </div>
                  <p className="text-white/25 text-xs shrink-0">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </p>
                </div>

                {!u.isFounder && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/5">
                    {u.isActive !== false ? (
                      <button
                        onClick={() => triggerConfirm(
                          `Suspend ${u.email}`,
                          "This will disable the user's account. They will not be able to log in.",
                          async (p) => userAction(u.id, "suspend", { reason: "Suspended by founder", confirmPhrase: p }),
                        )}
                        className="text-xs text-red-400/60 hover:text-red-400 border border-red-900/20 hover:border-red-700/30 px-2 py-0.5 rounded transition-colors"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => triggerConfirm(
                          `Restore ${u.email}`,
                          "Re-enable this user's account.",
                          async (p) => userAction(u.id, "restore", { confirmPhrase: p }),
                        )}
                        className="text-xs text-green-400/60 hover:text-green-400 border border-green-900/20 hover:border-green-700/30 px-2 py-0.5 rounded transition-colors"
                      >
                        Restore
                      </button>
                    )}
                    <button
                      onClick={() => triggerConfirm(
                        `Promote ${u.email} to Moderator`,
                        "This will change the user's role to 'moderator'.",
                        async (p) => userAction(u.id, "set_role", { role: u.role === "moderator" ? "user" : "moderator", confirmPhrase: p }),
                      )}
                      className="text-xs text-white/30 hover:text-white/60 border border-white/8 hover:border-white/15 px-2 py-0.5 rounded transition-colors"
                    >
                      {u.role === "moderator" ? "Demote" : "Moderator"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── API KEYS ─────────────────────────────────────────────────────── */}
      {tab === "apikeys" && !loadingTab && (
        <div className="space-y-1.5">
          {apiKeyList.length === 0 && (
            <p className="text-white/25 text-sm text-center py-8">No API keys.</p>
          )}
          {apiKeyList.map((k) => (
            <div key={k.id} className="flex items-center justify-between p-3.5 rounded-xl bg-white/3 border border-white/7 gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-white/70 text-xs font-mono">{k.keyPrefix}…</span>
                  <Badge
                    text={k.tier.toUpperCase()}
                    variant={k.tier === "enterprise" ? "red" : k.tier === "pro" ? "amber" : k.tier === "starter" ? "blue" : "blue"}
                  />
                  {!k.isActive && <Badge text="REVOKED" variant="red" />}
                </div>
                <p className="text-white/30 text-xs mt-0.5">
                  {k.userEmail ?? "Unknown"} · {k.requestsToday ?? 0} req today
                  {k.lastUsedAt && ` · Last used ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                </p>
              </div>
              {k.isActive && (
                <button
                  onClick={() => triggerConfirm(
                    "Revoke API Key",
                    `Revoke key ${k.keyPrefix}… (${k.userEmail})? This cannot be undone.`,
                    async (p) => {
                      await apiFetch("/api/founder/api-keys", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "revoke", keyId: k.id, confirmPhrase: p }),
                      });
                      await loadTab("apikeys");
                    },
                  )}
                  className="text-xs text-red-400/50 hover:text-red-400 border border-red-900/20 hover:border-red-700/30 px-2 py-0.5 rounded transition-colors shrink-0"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── POINTS ───────────────────────────────────────────────────────── */}
      {tab === "points" && !loadingTab && (
        <div className="space-y-5">
          {/* Manual award form */}
          <div className="p-4 rounded-2xl bg-white/3 border border-white/8 space-y-3">
            <p className="text-white text-sm font-semibold">Manual Award</p>
            <div className="grid sm:grid-cols-3 gap-2">
              <input
                type="text" value={awardUserId} onChange={(e) => setAwardUserId(e.target.value)}
                placeholder="User ID"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-red-500/30 font-mono"
              />
              <input
                type="number" value={awardAmount} onChange={(e) => setAwardAmount(e.target.value)}
                placeholder="Points"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-red-500/30"
              />
              <input
                type="text" value={awardReason} onChange={(e) => setAwardReason(e.target.value)}
                placeholder="Reason"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-red-500/30"
              />
            </div>
            <button
              disabled={!awardUserId || !awardAmount || !awardReason}
              onClick={() => triggerConfirm(
                "Award Points",
                `Award ${awardAmount} pts to user ${awardUserId}?`,
                async (p) => {
                  await apiFetch("/api/founder/points", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "award",
                      userId: awardUserId,
                      amount: parseInt(awardAmount),
                      reason: awardReason,
                      confirmPhrase: p,
                    }),
                  });
                  setAwardUserId(""); setAwardAmount(""); setAwardReason("");
                  await loadTab("points");
                },
              )}
              className="px-4 py-2 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 disabled:opacity-40 transition-colors"
            >
              Award (requires L3 confirmation)
            </button>
          </div>

          {/* Ledger */}
          <div className="space-y-1">
            {ledger.map((row) => (
              <div key={row.id} className={`flex items-center justify-between p-3 rounded-xl gap-3 ${
                row.isFlagged ? "bg-red-500/5 border border-red-500/12" : "bg-white/2 border border-white/6"
              }`}>
                <div className="min-w-0">
                  <p className="text-white/70 text-xs truncate">{row.description}</p>
                  <p className="text-white/25 text-xs font-mono mt-0.5">
                    {row.userEmail ?? row.userId} · {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
                    {row.isFlagged && " · "}
                    {row.isFlagged && <span className="text-red-400">FLAGGED</span>}
                  </p>
                </div>
                <span className={`text-sm font-semibold tabular-nums shrink-0 ${row.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                  {row.amount > 0 ? "+" : ""}{row.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CONFIG ───────────────────────────────────────────────────────── */}
      {tab === "config" && !loadingTab && (
        <div className="space-y-6">
          {/* System config */}
          <div>
            <p className="text-white/30 text-xs uppercase tracking-wide font-mono mb-3">System Config</p>
            <div className="space-y-1.5">
              {configRows.map((row) => (
                <div key={row.key} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/7 gap-3">
                  <div className="min-w-0">
                    <p className="text-white/70 text-xs font-mono">{row.key}</p>
                    {row.description && <p className="text-white/25 text-xs mt-0.5">{row.description}</p>}
                  </div>
                  <span className="text-amber-400/80 text-xs font-mono shrink-0 ml-3">
                    {JSON.stringify(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Feature flags */}
          <div>
            <p className="text-white/30 text-xs uppercase tracking-wide font-mono mb-3">Feature Flags</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {flagRows.map((flag) => (
                <div key={flag.key} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/7">
                  <div>
                    <p className="text-white/70 text-xs font-mono">{flag.key}</p>
                    {flag.description && <p className="text-white/25 text-xs mt-0.5">{flag.description}</p>}
                  </div>
                  <button
                    onClick={() => triggerConfirm(
                      `Toggle ${flag.key}`,
                      `Set ${flag.key} to ${!flag.enabled}?`,
                      async (p) => {
                        await apiFetch("/api/founder/config", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ type: "flag", key: flag.key, enabled: !flag.enabled, confirmPhrase: p }),
                        });
                        await loadTab("config");
                      },
                    )}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      flag.enabled ? "bg-green-500/50" : "bg-white/10"
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      flag.enabled ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── AUDIT LOG ────────────────────────────────────────────────────── */}
      {tab === "audit" && !loadingTab && (
        <div className="space-y-6">
          {/* Security Events callout */}
          <SecurityEvents rows={auditRows} />

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/30 text-xs font-mono">
                Showing latest {auditRows.length} entries — immutable audit trail
              </p>
              <a
                href="/api/founder/export?type=audit"
                download
                className="text-xs text-white/30 hover:text-white/60 border border-white/8 hover:border-white/15 px-2.5 py-1 rounded-lg transition-colors font-mono"
              >
                Export CSV
              </a>
            </div>

            <div className="space-y-1">
              {auditRows.map((row) => (
                <div key={row.id} className="p-3 rounded-xl bg-white/2 border border-white/5 font-mono">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-xs ${
                      ["auth_failed","auth_locked","rate_limited","forbidden_access","founder_access_attempt"].includes(row.actionType)
                        ? "text-red-400/80"
                        : "text-amber-400/80"
                    }`}>{row.actionType}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge text={`L${row.verificationLevel}`} variant="blue" />
                      <span className="text-white/20 text-xs">
                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
                      </span>
                    </div>
                  </div>
                  {(row.targetType || row.targetId) && (
                    <p className="text-white/30 text-xs mt-0.5">
                      {row.targetType} {row.targetId}
                    </p>
                  )}
                  {row.detail && (
                    <p className="text-white/20 text-xs mt-0.5 truncate">
                      {JSON.stringify(row.detail)}
                    </p>
                  )}
                  {row.ipAddress && (
                    <p className="text-white/15 text-xs mt-0.5">{row.ipAddress}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
