"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
    <div className="border-b border-white/8 pb-6 mb-6 last:border-b-0 last:mb-0 last:pb-0">
      <h2 className="text-white font-semibold text-sm mb-3">{label}</h2>
      <div className="space-y-2">
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

export default function AccessibilityPage() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [fontSize, setFontSize] = useState<FontSize>("default");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setTheme((localStorage.getItem("ca-theme") as Theme) ?? "dark");
    setFontSize((localStorage.getItem("ca-font-size") as FontSize) ?? "default");
    setReduceMotion(localStorage.getItem("ca-reduce-motion") === "true");
  }, []);

  function applyAndSave(newTheme: Theme, newFont: FontSize, newMotion: boolean) {
    localStorage.setItem("ca-theme", newTheme);
    localStorage.setItem("ca-font-size", newFont);
    localStorage.setItem("ca-reduce-motion", String(newMotion));

    // Apply theme via data-theme attribute — CSS vars react to this immediately
    document.documentElement.setAttribute("data-theme", newTheme);

    // Apply font-size class to root (maps to CSS html.font-large / html.font-xlarge)
    document.documentElement.classList.remove("font-large", "font-xlarge");
    if (newFont === "large") document.documentElement.classList.add("font-large");
    if (newFont === "xlarge") document.documentElement.classList.add("font-xlarge");

    // Apply reduce motion class (html.reduce-motion suppresses all transitions)
    if (newMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const handleTheme = (v: Theme) => { setTheme(v); applyAndSave(v, fontSize, reduceMotion); };
  const handleFont = (v: FontSize) => { setFontSize(v); applyAndSave(theme, v, reduceMotion); };
  const handleMotion = (v: boolean) => { setReduceMotion(v); applyAndSave(theme, fontSize, v); };

  return (
    <div className="px-4 sm:px-6 py-6 max-w-xl">
      <div className="flex items-center gap-3 mb-6 md:hidden">
        <Link href="/settings" className="text-white/40 hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </Link>
        <h1 className="text-white text-xl font-bold">Accessibility & Display</h1>
      </div>
      <h1 className="hidden md:block text-white text-xl font-bold mb-6">Accessibility &amp; Display</h1>

      {saved && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          Display preferences saved.
        </div>
      )}

      <p className="text-white/40 text-xs mb-6">
        These preferences are stored locally in your browser and apply to this device only.
      </p>

      <RadioGroup
        label="Theme"
        value={theme}
        onChange={handleTheme}
        options={[
          { value: "dark", label: "Dark", description: "Dark background — easier on the eyes at night." },
          { value: "light", label: "Light", description: "Full light-theme support coming soon." },
          { value: "system", label: "System", description: "Match your device's system preference." },
        ]}
      />

      <RadioGroup
        label="Font size"
        value={fontSize}
        onChange={handleFont}
        options={[
          { value: "default", label: "Default", description: "Standard reading size." },
          { value: "large", label: "Large", description: "Slightly larger for easier reading." },
          { value: "xlarge", label: "Extra Large", description: "Maximum size for accessibility." },
        ]}
      />

      <div className="border-b border-white/8 pb-6 mb-6">
        <h2 className="text-white font-semibold text-sm mb-3">Motion</h2>
        <Toggle
          label="Reduce animations"
          description="Minimises transitions and motion effects throughout the app."
          checked={reduceMotion}
          onChange={handleMotion}
        />
      </div>

      <div>
        <h2 className="text-white font-semibold text-sm mb-3">Language</h2>
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div>
            <p className="text-white text-sm font-medium">English</p>
            <p className="text-white/40 text-xs mt-0.5">Additional languages coming soon.</p>
          </div>
          <span className="text-xs text-white/30 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">Current</span>
        </div>
      </div>
    </div>
  );
}
