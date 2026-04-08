"use client";

import { useMemo, useState } from "react";

export interface PasswordCriteria {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function checkPassword(password: string): PasswordCriteria {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?`~]/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const c = checkPassword(password);
  return c.minLength && c.hasUpper && c.hasLower && c.hasNumber && c.hasSpecial;
}

const CRITERIA_LABELS: { key: keyof PasswordCriteria; label: string }[] = [
  { key: "minLength", label: "At least 8 characters" },
  { key: "hasUpper", label: "One uppercase letter (A–Z)" },
  { key: "hasLower", label: "One lowercase letter (a–z)" },
  { key: "hasNumber", label: "One number (0–9)" },
  { key: "hasSpecial", label: "One special character (!@#$%^&*…)" },
];

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
}

export function PasswordStrengthField({ label, value, onChange, autoComplete, placeholder }: Props) {
  const [show, setShow] = useState(false);
  const criteria = useMemo(() => checkPassword(value), [value]);
  const metCount = Object.values(criteria).filter(Boolean).length;
  const strength = !value ? null : metCount <= 2 ? "weak" : metCount <= 4 ? "medium" : "strong";

  return (
    <div>
      <label className="block text-sm text-white/60 mb-1.5">{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "••••••••"}
          autoComplete={autoComplete}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 pr-10 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/25 focus:bg-white/8 transition-colors"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            color: "#888",
            display: "flex",
            alignItems: "center",
          }}
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {value.length > 0 && (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  strength === "strong"
                    ? "bg-green-500"
                    : strength === "medium"
                      ? "bg-amber-400"
                      : "bg-red-500"
                }`}
                style={{ width: `${(metCount / 5) * 100}%` }}
              />
            </div>
            <span
              className={`text-xs font-medium min-w-[42px] ${
                strength === "strong"
                  ? "text-green-400"
                  : strength === "medium"
                    ? "text-amber-400"
                    : "text-red-400"
              }`}
            >
              {strength === "strong" ? "Strong" : strength === "medium" ? "Medium" : "Weak"}
            </span>
          </div>
          <ul className="space-y-1">
            {CRITERIA_LABELS.map(({ key, label: cLabel }) => (
              <li
                key={key}
                className={`text-xs flex items-center gap-1.5 transition-colors ${
                  criteria[key] ? "text-green-400/70" : "text-red-400"
                }`}
              >
                <span className="shrink-0 font-mono">{criteria[key] ? "✓" : "✗"}</span>
                {cLabel}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
