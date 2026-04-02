"use client";

import Link from "next/link";

const SECTIONS = [
  {
    path: "/settings/account",
    label: "Your Account",
    description: "Name, bio, username, account type, email",
  },
  {
    path: "/settings/security",
    label: "Security & Account Access",
    description: "Password, login history, connected accounts",
  },
  {
    path: "/settings/privacy",
    label: "Privacy & Safety",
    description: "Visibility, who can comment, muted words",
  },
  {
    path: "/settings/notifications",
    label: "Notifications",
    description: "Email and push notification preferences",
  },
  {
    path: "/settings/personalization",
    label: "Personalization & Data",
    description: "Feed algorithm, interests, your data",
  },
  {
    path: "/settings/accessibility",
    label: "Accessibility & Display",
    description: "Theme, font size, motion preferences",
  },
];

export default function SettingsHubPage() {
  return (
    <div className="px-4 py-6">
      {/* Mobile heading — hidden on desktop since sidebar shows "Settings" */}
      <div className="md:hidden mb-6">
        <h1 className="text-white text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-white/40 text-sm mt-1">Manage your account and preferences</p>
      </div>

      <div className="space-y-0.5">
        {SECTIONS.map(({ path, label, description }) => (
          <Link
            key={path}
            href={path}
            className="flex items-center justify-between px-3 py-4 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div>
              <p className="text-white text-sm font-medium">{label}</p>
              <p className="text-white/40 text-xs mt-0.5">{description}</p>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white/25 shrink-0 group-hover:text-white/40 transition-colors"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}

        <div className="pt-2 mt-2 border-t border-white/8">
          <Link
            href="/help"
            className="flex items-center justify-between px-3 py-4 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div>
              <p className="text-white text-sm font-medium">Help Center</p>
              <p className="text-white/40 text-xs mt-0.5">FAQs, contact support</p>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white/25 shrink-0 group-hover:text-white/40 transition-colors"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
