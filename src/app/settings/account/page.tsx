"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PasswordStrengthField, isPasswordValid } from "@/components/PasswordStrengthField";

interface ProfileData {
  bio: string | null;
  avatarUrl: string | null;
  username: string | null;
  phone: string | null;
  isPublic: boolean;
  isActive: boolean;
}

interface UserData {
  name: string | null;
  email: string;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/8 pb-6 mb-6 last:border-b-0 last:mb-0 last:pb-0">
      <h2 className="text-white font-semibold text-sm mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs text-white/50 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-white/25 transition-colors";

function Msg({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span className={`text-xs ${ok ? "text-green-400" : "text-red-400"}`}>{text}</span>
  );
}

function Banner() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");
  const info = searchParams.get("info");

  if (success === "email-changed") {
    return (
      <div className="mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
        Email address updated successfully.
      </div>
    );
  }
  if (info === "check-new-email") {
    return (
      <div className="mb-6 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
        Your current email was confirmed. Check your new inbox for the final confirmation link.
      </div>
    );
  }
  if (error === "invalid-token") {
    return (
      <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
        Invalid or expired link.
      </div>
    );
  }
  if (error === "token-expired") {
    return (
      <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
        The link has expired. Please request a new email change.
      </div>
    );
  }
  return null;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const [deactivatePw, setDeactivatePw] = useState("");
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);
  const [deactivateMsg, setDeactivateMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const [deletePw, setDeletePw] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status !== "authenticated") return;

    fetch("/api/settings")
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({})) as { error?: string };
          throw new Error(err.error ?? `HTTP ${r.status}`);
        }
        return r.json() as Promise<{ user: UserData; profile: ProfileData | null }>;
      })
      .then((d) => {
        if (!d?.user) { setLoadError("Could not load account data."); return; }
        setUserData(d.user);
        setName(d.user.name ?? "");
        setUsername(d.profile?.username ?? "");
        setBio(d.profile?.bio ?? "");
        setAvatarUrl(d.profile?.avatarUrl ?? "");
        setPhone(d.profile?.phone ?? "");
        setIsPublic(d.profile?.isPublic ?? true);
      })
      .catch((err: unknown) => {
        console.error("[settings/account] load error:", err);
        setLoadError(err instanceof Error ? err.message : "Failed to load account data.");
      });
  }, [status, router]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);
    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio, avatarUrl, username, phone, isPublic }),
    });
    setProfileLoading(false);
    if (res.ok) {
      setProfileMsg({ ok: true, text: "Profile saved." });
    } else {
      const d = await res.json() as { error?: string };
      setProfileMsg({ ok: false, text: d.error ?? "Failed to save." });
    }
  }

  async function handleEmailSave(e: React.FormEvent) {
    e.preventDefault();
    setEmailMsg(null);
    setEmailLoading(true);
    const res = await fetch("/api/settings/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newEmail }),
    });
    setEmailLoading(false);
    if (res.ok) {
      setEmailMsg({ ok: true, text: "Verification link sent to your current email. Check your inbox." });
      setNewEmail("");
    } else {
      const d = await res.json() as { error?: string };
      setEmailMsg({ ok: false, text: d.error ?? "Failed to initiate email change." });
    }
  }

  async function handleDeactivate() {
    setDeactivateMsg(null);
    setDeactivateLoading(true);
    const res = await fetch("/api/settings/deactivate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deactivatePw }),
    });
    setDeactivateLoading(false);
    if (res.ok) {
      await signOut({ callbackUrl: "/" });
    } else {
      const d = await res.json() as { error?: string };
      setDeactivateMsg({ ok: false, text: d.error ?? "Failed to deactivate." });
    }
  }

  async function handleDelete() {
    setDeleteMsg(null);
    setDeleteLoading(true);
    const res = await fetch("/api/settings/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePw }),
    });
    setDeleteLoading(false);
    if (res.ok) {
      await signOut({ callbackUrl: "/" });
    } else {
      const d = await res.json() as { error?: string };
      setDeleteMsg({ ok: false, text: d.error ?? "Failed to delete account." });
    }
  }

  if (status === "loading" || (!userData && !loadError)) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="px-4 sm:px-6 py-6 max-w-xl">
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <p className="font-medium mb-1">Failed to load account data</p>
          <p className="text-xs opacity-80">{loadError}</p>
          <p className="text-xs opacity-60 mt-2">If this persists, try signing out and back in, or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-xl">
      <div className="flex items-center gap-3 mb-6 md:hidden">
        <Link href="/settings" className="text-white/40 hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </Link>
        <h1 className="text-white text-xl font-bold">Your Account</h1>
      </div>
      <h1 className="hidden md:block text-white text-xl font-bold mb-6">Your Account</h1>

      <Suspense fallback={null}>
        <Banner />
      </Suspense>

      {/* Profile */}
      <Card title="Profile information">
        <form onSubmit={handleProfileSave} className="space-y-4">
          <Field label="Display name">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" className={inputCls} />
          </Field>
          <Field label="Username">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="your_handle"
                autoComplete="username"
                maxLength={20}
                className={`${inputCls} pl-8`}
              />
            </div>
            <p className="text-white/30 text-xs mt-1">3–20 characters, letters, numbers, underscores.</p>
          </Field>
          <Field label="Phone number">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (312) 555-0000"
              autoComplete="tel"
              className={inputCls}
            />
            <p className="text-white/30 text-xs mt-1">Used for sign in. Include country code.</p>
          </Field>
          <Field label="Bio">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="A little about yourself"
              className={`${inputCls} resize-none`}
            />
          </Field>
          <Field label="Avatar URL">
            <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" className={inputCls} />
          </Field>
          <div className="flex items-center gap-4">
            <button type="submit" disabled={profileLoading} className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors">
              {profileLoading ? "Saving…" : "Save profile"}
            </button>
            {profileMsg && <Msg ok={profileMsg.ok} text={profileMsg.text} />}
          </div>
        </form>
      </Card>

      {/* Account type */}
      <Card title="Account type">
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-white text-sm font-medium">{isPublic ? "Public" : "Private"} account</p>
            <p className="text-white/40 text-xs mt-0.5">
              {isPublic
                ? "Anyone can see your posts and profile."
                : "Only approved followers can see your posts."}
            </p>
          </div>
          <button
            onClick={async () => {
              const next = !isPublic;
              setIsPublic(next);
              await fetch("/api/settings/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublic: next }),
              });
            }}
            className={`relative w-11 h-6 rounded-full transition-colors ${isPublic ? "bg-white" : "bg-white/20"}`}
            role="switch"
            aria-checked={isPublic}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black transition-transform ${isPublic ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
        <p className="text-white/30 text-xs mt-2">Also configurable in Privacy &amp; Safety.</p>
      </Card>

      {/* Change email */}
      <Card title="Change email">
        <p className="text-white/40 text-sm mb-4">
          Current: <span className="text-white/70">{userData?.email}</span>
        </p>
        <form onSubmit={handleEmailSave} className="space-y-4">
          <Field label="New email address">
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@example.com" autoComplete="email" required className={inputCls} />
          </Field>
          <p className="text-white/30 text-xs -mt-2">
            A verification link will be sent to your <em>current</em> email first, then to your new address.
          </p>
          <div className="flex items-center gap-4">
            <button type="submit" disabled={emailLoading || !newEmail} className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors">
              {emailLoading ? "Sending…" : "Send verification"}
            </button>
            {emailMsg && <Msg ok={emailMsg.ok} text={emailMsg.text} />}
          </div>
        </form>
      </Card>

      {/* Download data */}
      <Card title="Download your data">
        <p className="text-white/40 text-sm mb-3">Export all your posts, likes, and account data as a JSON archive.</p>
        <button disabled className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/30 cursor-not-allowed">
          Coming soon
        </button>
      </Card>

      {/* Deactivate */}
      <Card title="Deactivate account">
        <p className="text-white/40 text-sm mb-3">
          Your account will be hidden from feeds. You can reactivate by signing back in.
        </p>
        {!deactivateConfirm ? (
          <button
            onClick={() => setDeactivateConfirm(true)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 transition-colors"
          >
            Deactivate account
          </button>
        ) : (
          <div className="space-y-3">
            <input
              type="password"
              value={deactivatePw}
              onChange={(e) => setDeactivatePw(e.target.value)}
              placeholder="Confirm with your password"
              className={inputCls}
            />
            <div className="flex gap-2 items-center">
              <button
                onClick={handleDeactivate}
                disabled={deactivateLoading || !deactivatePw}
                className="px-4 py-2 rounded-lg bg-white/10 text-sm text-white font-semibold hover:bg-white/15 disabled:opacity-50 transition-colors"
              >
                {deactivateLoading ? "Deactivating…" : "Confirm deactivation"}
              </button>
              <button onClick={() => { setDeactivateConfirm(false); setDeactivatePw(""); }} className="px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white/70 transition-colors">
                Cancel
              </button>
            </div>
            {deactivateMsg && <Msg ok={deactivateMsg.ok} text={deactivateMsg.text} />}
          </div>
        )}
      </Card>

      {/* Delete */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 space-y-3">
        <h2 className="text-red-400 font-semibold text-sm">Delete account</h2>
        <p className="text-white/40 text-sm">Permanently delete your account and all data. This cannot be undone.</p>
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)} className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 hover:bg-red-500/20 transition-colors">
            Delete account
          </button>
        ) : (
          <div className="space-y-3">
            <input
              type="password"
              value={deletePw}
              onChange={(e) => setDeletePw(e.target.value)}
              placeholder="Enter password to confirm"
              className="w-full bg-white/5 border border-red-500/30 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-red-500/40 transition-colors"
            />
            <div className="flex gap-2 items-center">
              <button
                onClick={handleDelete}
                disabled={deleteLoading || !deletePw}
                className="px-4 py-2 rounded-lg bg-red-500/80 text-sm text-white font-semibold hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {deleteLoading ? "Deleting…" : "Confirm deletion"}
              </button>
              <button onClick={() => { setDeleteConfirm(false); setDeletePw(""); }} className="px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white/70 transition-colors">
                Cancel
              </button>
            </div>
            {deleteMsg && <Msg ok={deleteMsg.ok} text={deleteMsg.text} />}
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="mt-6 pt-6 border-t border-white/8">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
