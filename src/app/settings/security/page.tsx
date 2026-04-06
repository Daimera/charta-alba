"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PasswordStrengthField, isPasswordValid } from "@/components/PasswordStrengthField";
import { PasswordInput } from "@/components/PasswordInput";

interface LoginSession {
  id: string;
  ipMasked: string;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  flag: string;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  isSuspicious: boolean;
  isCurrent: boolean;
  createdAt: string | null;
}

interface TwoFAStatus {
  enabled: boolean;
  enabledAt: string | null;
  backupCodesRemaining: number;
}

interface TrustedDevice {
  id: string;
  deviceName: string;
  city: string | null;
  country: string | null;
  lastUsedAt: string | null;
  createdAt: string | null;
}

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/8 pb-6 mb-6 last:border-b-0 last:mb-0 last:pb-0">
      <h2 className="text-white font-semibold text-sm mb-1">{title}</h2>
      {description && <p className="text-white/40 text-xs mb-4">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-white/25 transition-colors";

function Msg({ ok, text }: { ok: boolean; text: string }) {
  return <span className={`text-xs ${ok ? "text-green-400" : "text-red-400"}`}>{text}</span>;
}

// ── 2FA Setup Modal ────────────────────────────────────────────────────────────

function TwoFASetupFlow({ onClose, onEnabled }: { onClose: () => void; onEnabled: () => void }) {
  const [step, setStep] = useState<"qr" | "verify" | "backup">("qr");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/auth/2fa/setup", { method: "POST" })
      .then((r) => r.json() as Promise<{ otpauthUrl?: string; secret?: string; error?: string }>)
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setOtpauthUrl(d.otpauthUrl ?? "");
        setSecret(d.secret ?? "");
      })
      .catch(() => setError("Failed to start 2FA setup"))
      .finally(() => setLoading(false));
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.replace(/\s/g, "") }),
    });
    const data = await res.json() as { ok?: boolean; backupCodes?: string[]; error?: string };
    setLoading(false);
    if (data.ok && data.backupCodes) {
      setBackupCodes(data.backupCodes);
      setStep("backup");
    } else {
      setError(data.error ?? "Invalid code");
      setCode("");
    }
  }

  async function handleCopyBackupCodes() {
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const qrSrc = otpauthUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpauthUrl)}`
    : null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">
            {step === "qr" && "Set up authenticator"}
            {step === "verify" && "Verify setup"}
            {step === "backup" && "Save backup codes"}
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {step === "qr" && (
          <>
            <p className="text-white/50 text-xs">Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.).</p>
            {loading ? (
              <div className="h-[180px] flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
              </div>
            ) : error ? (
              <p className="text-red-400 text-xs text-center">{error}</p>
            ) : (
              <>
                <div className="flex justify-center">
                  {qrSrc && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrSrc} alt="2FA QR code" width={180} height={180} className="rounded-lg bg-white p-2" />
                  )}
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Can&apos;t scan? Enter this key manually:</p>
                  <p className="text-white font-mono text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 break-all">{secret}</p>
                </div>
                <button
                  onClick={() => setStep("verify")}
                  className="w-full bg-white text-black font-semibold py-2.5 rounded-xl text-sm hover:bg-white/90 transition-colors"
                >
                  Next — Verify code
                </button>
              </>
            )}
          </>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-white/50 text-xs">Enter the 6-digit code from your authenticator app to confirm setup.</p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-xl font-mono tracking-[0.4em] placeholder-white/20 focus:outline-none focus:border-white/30"
            />
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep("qr")} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors">
                Back
              </button>
              <button
                type="submit"
                disabled={loading || code.replace(/\s/g, "").length < 6}
                className="flex-1 bg-white text-black font-semibold py-2.5 rounded-xl text-sm hover:bg-white/90 disabled:opacity-50 transition-colors"
              >
                {loading ? "Verifying…" : "Enable 2FA"}
              </button>
            </div>
          </form>
        )}

        {step === "backup" && (
          <>
            <p className="text-white/50 text-xs">
              Save these backup codes somewhere safe. Each code can only be used once if you lose access to your authenticator app.
            </p>
            <div className="bg-white/4 border border-white/10 rounded-xl p-4 grid grid-cols-2 gap-y-1.5 gap-x-4">
              {backupCodes.map((c) => (
                <code key={c} className="text-white/80 text-xs font-mono">{c}</code>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCopyBackupCodes}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
              >
                {copied ? "Copied!" : "Copy codes"}
              </button>
              <button
                onClick={() => { onEnabled(); onClose(); }}
                className="flex-1 bg-white text-black font-semibold py-2.5 rounded-xl text-sm hover:bg-white/90 transition-colors"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── 2FA Disable Modal ─────────────────────────────────────────────────────────

function TwoFADisableModal({ onClose, onDisabled }: { onClose: () => void; onDisabled: () => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/2fa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.replace(/\s/g, "") }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };
    setLoading(false);
    if (data.ok) {
      onDisabled();
      onClose();
    } else {
      setError(data.error ?? "Invalid code");
      setCode("");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Disable 2FA</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <p className="text-white/50 text-xs">Enter your 6-digit TOTP code or a backup code to confirm you want to disable two-factor authentication.</p>
        <form onSubmit={handleDisable} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={40}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000 or backup-code"
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center font-mono text-sm placeholder-white/20 focus:outline-none focus:border-white/30"
          />
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || code.replace(/\s/g, "").length < 6}
              className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "Disabling…" : "Disable 2FA"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const { status } = useSession();
  const router = useRouter();

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [signOutAllLoading, setSignOutAllLoading] = useState(false);

  const [twoFAStatus, setTwoFAStatus] = useState<TwoFAStatus | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [removeAllLoading, setRemoveAllLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status !== "authenticated") return;

    fetch("/api/settings/sessions")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { sessions?: LoginSession[]; connectedProviders?: string[] } | null) => {
        setSessions(d?.sessions ?? []);
        setConnectedProviders(d?.connectedProviders ?? []);
      })
      .catch(() => undefined)
      .finally(() => setSessionsLoading(false));

    fetch("/api/auth/2fa/status")
      .then((r) => r.ok ? r.json() : null)
      .then((d: TwoFAStatus | null) => { if (d) setTwoFAStatus(d); })
      .catch(() => undefined);

    fetch("/api/auth/trusted-devices")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { devices?: TrustedDevice[] } | null) => setTrustedDevices(d?.devices ?? []))
      .catch(() => undefined)
      .finally(() => setDevicesLoading(false));
  }, [status, router]);

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) { setPwMsg({ ok: false, text: "Passwords do not match." }); return; }
    if (!isPasswordValid(newPw)) { setPwMsg({ ok: false, text: "Password does not meet the strength requirements." }); return; }
    setPwLoading(true);
    const res = await fetch("/api/settings/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    setPwLoading(false);
    if (res.ok) {
      setPwMsg({ ok: true, text: "Password changed." });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } else {
      const d = await res.json() as { error?: string };
      setPwMsg({ ok: false, text: d.error ?? "Failed to change password." });
    }
  }

  async function handleRemoveDevice(id: string) {
    await fetch(`/api/auth/trusted-devices/${id}`, { method: "DELETE" });
    setTrustedDevices((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleRemoveAllDevices() {
    setRemoveAllLoading(true);
    await fetch("/api/auth/trusted-devices", { method: "DELETE" });
    setTrustedDevices([]);
    setRemoveAllLoading(false);
  }

  async function handleSignOutAll() {
    setSignOutAllLoading(true);
    await fetch("/api/settings/sessions", { method: "DELETE" });
    setSignOutAllLoading(false);
    await signOut({ callbackUrl: "/auth/signin" });
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {showSetup && (
        <TwoFASetupFlow
          onClose={() => setShowSetup(false)}
          onEnabled={() => {
            fetch("/api/auth/2fa/status")
              .then((r) => r.json() as Promise<TwoFAStatus>)
              .then((d) => setTwoFAStatus(d))
              .catch(() => undefined);
          }}
        />
      )}
      {showDisable && (
        <TwoFADisableModal
          onClose={() => setShowDisable(false)}
          onDisabled={() => setTwoFAStatus((prev) => prev ? { ...prev, enabled: false, enabledAt: null } : null)}
        />
      )}

      <div className="px-4 sm:px-6 py-6 max-w-xl">
        <div className="flex items-center gap-3 mb-6 md:hidden">
          <Link href="/settings" className="text-white/40 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </Link>
          <h1 className="text-white text-xl font-bold">Security & Account Access</h1>
        </div>
        <h1 className="hidden md:block text-white text-xl font-bold mb-6">Security &amp; Account Access</h1>

        {/* Change password */}
        <Card title="Change password">
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Current password</label>
              <PasswordInput value={currentPw} onChange={setCurrentPw} autoComplete="current-password" className={inputCls + " pr-10"} />
            </div>
            <PasswordStrengthField label="New password" value={newPw} onChange={setNewPw} autoComplete="new-password" />
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Confirm new password</label>
              <PasswordInput value={confirmPw} onChange={setConfirmPw} autoComplete="new-password" className={inputCls + " pr-10"} />
            </div>
            <div className="flex items-center gap-4">
              <button type="submit" disabled={pwLoading} className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors">
                {pwLoading ? "Changing…" : "Change password"}
              </button>
              {pwMsg && <Msg ok={pwMsg.ok} text={pwMsg.text} />}
            </div>
          </form>
        </Card>

        {/* 2FA */}
        <Card title="Two-factor authentication" description="Add an extra layer of security to your account.">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/4 border border-white/8">
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${twoFAStatus?.enabled ? "bg-green-400" : "bg-white/25"}`} />
                <div>
                  <p className="text-white text-sm font-medium">Authenticator app</p>
                  {twoFAStatus?.enabled ? (
                    <p className="text-white/40 text-xs mt-0.5">
                      Enabled {twoFAStatus.enabledAt ? `since ${new Date(twoFAStatus.enabledAt).toLocaleDateString()}` : ""}
                    </p>
                  ) : (
                    <p className="text-white/40 text-xs mt-0.5">Not enabled</p>
                  )}
                </div>
              </div>
              {twoFAStatus?.enabled ? (
                <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">Enabled</span>
              ) : (
                <span className="text-xs text-white/30 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">Disabled</span>
              )}
            </div>

            {twoFAStatus?.enabled && (
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-white/40">
                  Backup codes remaining: <span className={`font-semibold ${(twoFAStatus.backupCodesRemaining ?? 0) <= 2 ? "text-yellow-400" : "text-white/70"}`}>{twoFAStatus.backupCodesRemaining}</span>
                </span>
                {(twoFAStatus.backupCodesRemaining ?? 0) <= 2 && (
                  <span className="text-yellow-400">Low — regenerate soon</span>
                )}
              </div>
            )}

            <div className="flex gap-3">
              {!twoFAStatus?.enabled ? (
                <button
                  onClick={() => setShowSetup(true)}
                  className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
                >
                  Enable 2FA
                </button>
              ) : (
                <button
                  onClick={() => setShowDisable(true)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Disable 2FA
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Login history */}
        <Card title="Login history" description="Your last 10 sign-in events.">
          {sessionsLoading ? (
            <div className="w-4 h-4 border-2 border-white/15 border-t-white/40 rounded-full animate-spin" />
          ) : sessions.length === 0 ? (
            <p className="text-white/30 text-sm">Login history is recorded from your next sign-in.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={`p-3 rounded-lg border ${
                    s.isSuspicious
                      ? "bg-red-500/6 border-red-500/20"
                      : "bg-white/4 border-white/8"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="text-base shrink-0 mt-0.5">{s.flag || "🌍"}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white/80 text-xs font-medium">
                            {[s.city, s.country].filter(Boolean).join(", ") || "Unknown location"}
                          </span>
                          {s.isCurrent && (
                            <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full leading-none">
                              This device
                            </span>
                          )}
                          {s.isSuspicious && (
                            <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full leading-none">
                              Suspicious
                            </span>
                          )}
                        </div>
                        <p className="text-white/35 text-xs mt-0.5">
                          {[s.browser, s.os, s.deviceType].filter(Boolean).join(" · ") || "Unknown device"}
                        </p>
                        <p className="text-white/20 text-xs font-mono mt-0.5">{s.ipMasked || "—"}</p>
                      </div>
                    </div>
                    <p className="text-white/30 text-xs shrink-0">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Connected accounts */}
        <Card title="Connected accounts" description="Third-party accounts linked to your Charta Alba profile.">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/4 border border-white/8">
            <div className="flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 0 1 0-12.064 5.96 5.96 0 0 1 4.134 1.659l2.776-2.777A9.98 9.98 0 0 0 12.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
              </svg>
              <div>
                <p className="text-white text-sm font-medium">Google</p>
                <p className="text-white/40 text-xs">
                  {connectedProviders.includes("google") ? "Connected" : "Not connected"}
                </p>
              </div>
            </div>
            {connectedProviders.includes("google") && (
              <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">Active</span>
            )}
          </div>
        </Card>

        {/* Trusted devices */}
        <Card title="Trusted devices" description="Devices you've chosen to stay signed in for 30 days.">
          {devicesLoading ? (
            <div className="w-4 h-4 border-2 border-white/15 border-t-white/40 rounded-full animate-spin" />
          ) : trustedDevices.length === 0 ? (
            <p className="text-white/30 text-sm">No trusted devices. Check &quot;Remember this device&quot; when signing in.</p>
          ) : (
            <div className="space-y-2">
              {trustedDevices.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-white/4 border border-white/8">
                  <div>
                    <p className="text-white/80 text-xs font-medium">{d.deviceName}</p>
                    <p className="text-white/35 text-xs mt-0.5">
                      {[d.city, d.country].filter(Boolean).join(", ") || "Unknown location"}
                      {d.lastUsedAt ? ` · Last used ${new Date(d.lastUsedAt).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveDevice(d.id)}
                    className="text-xs text-red-400/70 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={handleRemoveAllDevices}
                disabled={removeAllLoading}
                className="mt-2 px-3 py-1.5 rounded-lg text-xs text-red-400/70 hover:text-red-400 border border-white/8 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
              >
                {removeAllLoading ? "Removing…" : "Remove all devices"}
              </button>
            </div>
          )}
        </Card>

        {/* Sessions */}
        <Card title="Active sessions">
          <p className="text-white/40 text-sm mb-4">
            Signing out of all devices will end your current session. Full cross-device revocation requires server-side session management (coming in Phase 3).
          </p>
          <button
            onClick={handleSignOutAll}
            disabled={signOutAllLoading}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 disabled:opacity-50 transition-colors"
          >
            {signOutAllLoading ? "Signing out…" : "Sign out of all devices"}
          </button>
        </Card>
      </div>
    </>
  );
}
