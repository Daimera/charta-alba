"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SUPPORTED_LANGUAGES, setPreferredLanguage, getStoredLanguage, usePreferredLanguage, type LanguageCode } from "@/components/LanguageSwitcher";
import { t } from "@/lib/i18n";

function Msg({ ok, text }: { ok: boolean; text: string }) {
  return <span className={`text-xs ${ok ? "text-green-400" : "text-red-400"}`}>{text}</span>;
}

const ALGORITHMS = [
  { value: "trending", label: "Trending", description: "Top-liked papers from the past 7 days." },
  { value: "chronological", label: "Chronological", description: "Newest papers first." },
  { value: "following", label: "Following only", description: "Papers from topics you follow." },
];

export default function PersonalizationPage() {
  const { status } = useSession();
  const router = useRouter();

  const [feedAlgorithm, setFeedAlgorithm] = useState("trending");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Initialize from localStorage so the dropdown shows the right value immediately,
  // before the async DB fetch completes (DB fetch may override if non-default).
  const [language, setLanguage] = useState<LanguageCode>(() =>
    typeof window !== "undefined" ? getStoredLanguage() : "en"
  );
  const [langLoading, setLangLoading] = useState(false);
  const [langMsg, setLangMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [langSaved, setLangSaved] = useState(false);
  const [uiLang] = usePreferredLanguage();

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status !== "authenticated") return;

    fetch("/api/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { profile?: { feedAlgorithm?: string; preferredLanguage?: string } | null } | null) => {
        if (d?.profile?.feedAlgorithm) setFeedAlgorithm(d.profile.feedAlgorithm);
        // DB is source of truth — always set dropdown from DB value when available
        if (d?.profile?.preferredLanguage) {
          setLanguage(d.profile.preferredLanguage as LanguageCode);
        }
      })
      .catch(() => undefined);
  }, [status, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedAlgorithm }),
    });
    setLoading(false);
    if (res.ok) setMsg({ ok: true, text: "Preferences saved." });
    else { const d = await res.json() as { error?: string }; setMsg({ ok: false, text: d.error ?? "Failed." }); }
  }

  async function handleLanguageSave(e: React.FormEvent) {
    e.preventDefault();
    setLangMsg(null);
    setLangLoading(true);
    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredLanguage: language }),
    });
    setLangLoading(false);
    if (res.ok) {
      setPreferredLanguage(language);
      setLangSaved(true);
      setLangMsg(null);
    } else {
      const d = await res.json() as { error?: string };
      setLangMsg({ ok: false, text: d.error ?? "Failed." });
    }
  }

  if (status === "loading") {
    return <div className="flex items-center justify-center py-20"><div className="w-5 h-5 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-xl">
      <div className="flex items-center gap-3 mb-6 md:hidden">
        <Link href="/settings" className="text-white/40 hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </Link>
        <h1 className="text-white text-xl font-bold">Personalization & Data</h1>
      </div>
      <h1 className="hidden md:block text-white text-xl font-bold mb-6">Personalization &amp; Data</h1>

      {/* Feed algorithm */}
      <div className="border-b border-white/8 pb-6 mb-6">
        <h2 className="text-white font-semibold text-sm mb-1">{t(uiLang, "settings.feedAlgorithm")}</h2>
        <p className="text-white/40 text-xs mb-4">Control how your main feed is ordered.</p>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-2">
            {ALGORITHMS.map(({ value, label, description }) => (
              <label key={value} className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${feedAlgorithm === value ? "bg-white/8 border-white/20" : "bg-white/3 border-white/8 hover:bg-white/5"}`}>
                <input
                  type="radio"
                  name="algorithm"
                  value={value}
                  checked={feedAlgorithm === value}
                  onChange={() => setFeedAlgorithm(value)}
                  className="mt-0.5 accent-white shrink-0"
                />
                <div>
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-white/40 text-xs mt-0.5">{description}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors">
              {loading ? "Saving…" : "Save"}
            </button>
            {msg && <Msg ok={msg.ok} text={msg.text} />}
          </div>
        </form>
      </div>

      {/* Preferred language */}
      <div className="border-b border-white/8 pb-6 mb-6">
        <h2 className="text-white font-semibold text-sm mb-1">{t(uiLang, "settings.prefLanguage")}</h2>
        <p className="text-white/40 text-xs mb-4">Paper cards will be translated into your chosen language. Saved to your profile so it follows you across devices.</p>
        <form onSubmit={handleLanguageSave} className="space-y-4">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/25 transition-colors appearance-none cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} style={{ background: "#111" }}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-4">
            <button type="submit" disabled={langLoading || langSaved} className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors">
              {langLoading ? "Saving…" : "Save language"}
            </button>
            {langSaved && (
              <>
                <span className="text-xs text-green-400">Saved. Reload to apply.</span>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 rounded-lg border border-white/20 text-xs text-white/70 hover:text-white hover:border-white/40 transition-colors"
                >
                  Reload now
                </button>
              </>
            )}
            {langMsg && <Msg ok={langMsg.ok} text={langMsg.text} />}
          </div>
        </form>
      </div>

      {/* Interests */}
      <div className="border-b border-white/8 pb-6 mb-6">
        <h2 className="text-white font-semibold text-sm mb-1">{t(uiLang, "settings.interests")}</h2>
        <p className="text-white/40 text-xs mb-4">Select topics to tune your feed. Use the follows system on individual tags for now.</p>
        <div className="p-4 rounded-xl bg-white/4 border border-white/8 text-center">
          <p className="text-white/40 text-sm">Topic interest picker coming soon.</p>
        </div>
      </div>

      {/* Data */}
      <div className="space-y-4">
        <h2 className="text-white font-semibold text-sm">About your data</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/4 border border-white/8">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-green-400 mt-0.5 shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <div>
              <p className="text-white text-sm font-medium">We don&apos;t sell your data</p>
              <p className="text-white/40 text-xs mt-0.5">Your reading history and interactions are never sold to third parties.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/4 border border-white/8">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-white/50 mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            <div>
              <p className="text-white text-sm font-medium">Free to use</p>
              <p className="text-white/40 text-xs mt-0.5">Full access to the feed and all features at no cost.</p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-white/40 text-xs mb-2">Download a copy of all your data:</p>
          <button disabled className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/30 cursor-not-allowed">
            Download your data — coming soon
          </button>
        </div>
      </div>
    </div>
  );
}
