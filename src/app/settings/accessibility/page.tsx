"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePreferredLanguage } from "@/components/LanguageSwitcher";
import { t } from "@/lib/i18n";

type Theme = "dark" | "light" | "system";
type FontSize = "default" | "large" | "xlarge";

function RadioGroup<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; description?: string }[];
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-white font-semibold text-sm mb-3">{label}</h2>
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
            value === opt.value ? "bg-white/8 border-white/20" : "bg-white/3 border-white/8 hover:bg-white/5"
          }`}
        >
          <input
            type="radio"
            name={label}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="accent-white shrink-0"
          />
          <div>
            <p className="text-white text-sm font-medium">{opt.label}</p>
            {opt.description && <p className="text-white/40 text-xs mt-0.5">{opt.description}</p>}
          </div>
        </label>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-white text-sm">{label}</p>
        {description && <p className="text-white/40 text-xs mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${checked ? "bg-white" : "bg-white/20"}`}
        role="switch" aria-checked={checked}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function SaveRow({ onSave, saved, loading }: { onSave: () => void; saved: boolean; loading?: boolean }) {
  return (
    <div className="flex items-center gap-3 pt-3">
      <button
        onClick={onSave}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "Saving…" : "Save"}
      </button>
      {saved && <span className="text-green-400 text-xs">Saved.</span>}
    </div>
  );
}

export default function AccessibilityPage() {
  const [lang] = usePreferredLanguage();
  // Current applied values (what's in localStorage / on the DOM)
  const [theme, setTheme] = useState<Theme>("dark");
  const [fontSize, setFontSize] = useState<FontSize>("default");
  const [reduceMotion, setReduceMotion] = useState(false);

  // Pending (staged) values — only committed on Save
  const [pendingTheme, setPendingTheme] = useState<Theme>("dark");
  const [pendingFont, setPendingFont] = useState<FontSize>("default");
  const [pendingMotion, setPendingMotion] = useState(false);

  const [themeSaved, setThemeSaved] = useState(false);
  const [fontSaved, setFontSaved] = useState(false);
  const [motionSaved, setMotionSaved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = (localStorage.getItem("ca-theme") as Theme) ?? "dark";
    const f = (localStorage.getItem("ca-font-size") as FontSize) ?? "default";
    const m = localStorage.getItem("ca-reduce-motion") === "true";
    setTheme(t); setPendingTheme(t);
    setFontSize(f); setPendingFont(f);
    setReduceMotion(m); setPendingMotion(m);
  }, []);

  function applyTheme(t: Theme) {
    localStorage.setItem("ca-theme", t);
    document.documentElement.setAttribute("data-theme", t);
    setTheme(t);
  }

  function applyFont(f: FontSize) {
    localStorage.setItem("ca-font-size", f);
    document.documentElement.classList.remove("font-large", "font-xlarge");
    if (f === "large") document.documentElement.classList.add("font-large");
    if (f === "xlarge") document.documentElement.classList.add("font-xlarge");
    setFontSize(f);
  }

  function applyMotion(m: boolean) {
    localStorage.setItem("ca-reduce-motion", String(m));
    if (m) document.documentElement.classList.add("reduce-motion");
    else document.documentElement.classList.remove("reduce-motion");
    setReduceMotion(m);
  }

  function flash(setter: (v: boolean) => void) {
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  function handleSaveTheme() {
    applyTheme(pendingTheme);
    flash(setThemeSaved);
  }
  function handleSaveFont() {
    applyFont(pendingFont);
    flash(setFontSaved);
  }
  function handleSaveMotion() {
    applyMotion(pendingMotion);
    flash(setMotionSaved);
  }

  void theme; void fontSize; void reduceMotion; // suppress "unused" — kept for symmetry

  return (
    <div className="px-4 sm:px-6 py-6 max-w-xl">
      <div className="flex items-center gap-3 mb-6 md:hidden">
        <Link href="/settings" className="text-white/40 hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </Link>
        <h1 className="text-white text-xl font-bold">Accessibility & Display</h1>
      </div>
      <h1 className="hidden md:block text-white text-xl font-bold mb-6">Accessibility &amp; Display</h1>

      <p className="text-white/40 text-xs mb-6">
        These preferences are stored locally in your browser and apply to this device only.
      </p>

      {/* Theme */}
      <div className="border-b border-white/8 pb-6 mb-6">
        <RadioGroup
          label={t(lang, "settings.theme")}
          value={pendingTheme}
          onChange={setPendingTheme}
          options={[
            { value: "dark", label: t(lang, "settings.dark"), description: "Dark background — easier on the eyes at night." },
            { value: "light", label: t(lang, "settings.light"), description: "Light background with dark text." },
            { value: "system", label: t(lang, "settings.system"), description: "Match your device's system preference." },
          ]}
        />
        <SaveRow onSave={handleSaveTheme} saved={themeSaved} />
      </div>

      {/* Font size */}
      <div className="border-b border-white/8 pb-6 mb-6">
        <RadioGroup
          label={t(lang, "settings.fontSize")}
          value={pendingFont}
          onChange={setPendingFont}
          options={[
            { value: "default", label: t(lang, "settings.fontDefault"), description: "Standard reading size." },
            { value: "large", label: t(lang, "settings.fontLarge"), description: "Slightly larger for easier reading." },
            { value: "xlarge", label: t(lang, "settings.fontXLarge"), description: "Maximum size for accessibility." },
          ]}
        />
        <SaveRow onSave={handleSaveFont} saved={fontSaved} />
      </div>

      {/* Motion */}
      <div className="border-b border-white/8 pb-6 mb-6">
        <h2 className="text-white font-semibold text-sm mb-3">{t(lang, "settings.motion")}</h2>
        <Toggle
          label={t(lang, "settings.reduceAnimations")}
          description="Minimises transitions and motion effects throughout the app."
          checked={pendingMotion}
          onChange={setPendingMotion}
        />
        <SaveRow onSave={handleSaveMotion} saved={motionSaved} />
      </div>

      {/* Language */}
      <div>
        <h2 className="text-white font-semibold text-sm mb-3">{t(lang, "settings.language")}</h2>
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div>
            <p className="text-white text-sm font-medium">English</p>
            <p className="text-white/40 text-xs mt-0.5">Change language in Settings → Personalization.</p>
          </div>
          <Link href="/settings/personalization" className="text-xs text-white/30 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full hover:text-white/60 transition-colors">
            Change
          </Link>
        </div>
      </div>
    </div>
  );
}
