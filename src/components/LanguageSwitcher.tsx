"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "zh-CN", name: "中文（简体）", flag: "🇨🇳" },
  { code: "zh-TW", name: "中文（繁體）", flag: "🇹🇼" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "sv", name: "Svenska", flag: "🇸🇪" },
  { code: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", name: "ภาษาไทย", flag: "🇹🇭" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

function getStoredLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem("preferredLanguage") as LanguageCode) ?? "en";
}

// Simple global state via module-level store (avoids context provider for this small feature)
const listeners = new Set<(lang: LanguageCode) => void>();
let currentLanguage: LanguageCode = "en";

export function getPreferredLanguage(): LanguageCode {
  return currentLanguage;
}

export function setPreferredLanguage(lang: LanguageCode) {
  currentLanguage = lang;
  if (typeof window !== "undefined") {
    localStorage.setItem("preferredLanguage", lang);
  }
  for (const fn of listeners) fn(lang);
}

export function usePreferredLanguage(): [LanguageCode, (lang: LanguageCode) => void] {
  const [lang, setLang] = useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      const stored = getStoredLanguage();
      currentLanguage = stored;
      return stored;
    }
    return "en";
  });

  useEffect(() => {
    listeners.add(setLang);
    return () => { listeners.delete(setLang); };
  }, []);

  return [lang, setPreferredLanguage];
}

export function LanguageSwitcher() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = usePreferredLanguage();
  const menuRef = useRef<HTMLDivElement>(null);

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === current) ?? SUPPORTED_LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function select(code: LanguageCode) {
    setCurrent(code);
    setOpen(false);

    // Persist to profile if signed in
    if (session?.user) {
      fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLanguage: code }),
      }).catch(() => undefined);
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={`Language: ${currentLang.name}. Click to change.`}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-white/55 hover:text-white hover:bg-white/8 transition-colors text-sm"
      >
        <span aria-hidden="true">{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.code.toUpperCase()}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 top-full mt-1 z-50 w-52 bg-[#1a1a1a] border border-white/12 rounded-xl shadow-xl overflow-hidden"
        >
          <div className="max-h-72 overflow-y-auto py-1">
            {SUPPORTED_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                role="option"
                aria-selected={lang.code === current}
                onClick={() => select(lang.code)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-white/8 transition-colors ${
                  lang.code === current ? "text-white bg-white/5" : "text-white/65"
                }`}
              >
                <span aria-hidden="true">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.name}</span>
                {lang.code === current && (
                  <svg className="w-4 h-4 text-white/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
