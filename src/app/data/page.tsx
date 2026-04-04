"use client";

import { useState } from "react";
import Link from "next/link";

type Tab = "your-data" | "our-practices" | "request";

const DATA_CATEGORIES = [
  {
    category: "Account Data",
    examples: "Email, name, password hash, profile photo URL",
    purpose: "Authentication and account management",
    retention: "Until account deletion + 30 days backup",
    canExport: true,
    canDelete: true,
  },
  {
    category: "Profile Data",
    examples: "Username, bio, public profile settings",
    purpose: "Public profile display and discovery",
    retention: "Until account deletion",
    canExport: true,
    canDelete: true,
  },
  {
    category: "Content Interactions",
    examples: "Likes, bookmarks, topic follows",
    purpose: "Personalising your feed",
    retention: "Until account deletion",
    canExport: true,
    canDelete: true,
  },
  {
    category: "Comments",
    examples: "Text of comments you post",
    purpose: "Community discussion",
    retention: "Content deleted on request; metadata (time, id) may remain anonymised",
    canExport: true,
    canDelete: true,
  },
  {
    category: "Login Sessions",
    examples: "IP address (masked for display), country, city, device/browser, timestamp",
    purpose: "Security monitoring and fraud prevention",
    retention: "90 days",
    canExport: true,
    canDelete: false,
  },
  {
    category: "Transaction Data",
    examples: "Purchase amount, Points balance, Stripe payment ID",
    purpose: "Processing payments and Points accounting",
    retention: "7 years (legal/tax requirement)",
    canExport: true,
    canDelete: false,
  },
  {
    category: "API Usage",
    examples: "API key prefix, request count, last-used timestamp",
    purpose: "Rate limiting and abuse prevention",
    retention: "90 days of request logs; key metadata until key deletion",
    canExport: true,
    canDelete: true,
  },
  {
    category: "Preferences",
    examples: "Feed algorithm, email notification settings, language, accessibility settings",
    purpose: "Personalising your experience",
    retention: "Until account deletion",
    canExport: true,
    canDelete: true,
  },
];

const THIRD_PARTIES = [
  {
    name: "Neon (Postgres)",
    purpose: "Database hosting",
    location: "AWS us-east-1 (USA)",
    privacyUrl: "https://neon.tech/privacy",
    dpa: true,
  },
  {
    name: "Vercel",
    purpose: "Web hosting and edge CDN",
    location: "Global edge / USA",
    privacyUrl: "https://vercel.com/legal/privacy-policy",
    dpa: true,
  },
  {
    name: "Anthropic",
    purpose: "AI-generated paper summaries",
    location: "USA",
    privacyUrl: "https://www.anthropic.com/privacy",
    dpa: false,
  },
  {
    name: "Stripe",
    purpose: "Payment processing",
    location: "USA / EEA",
    privacyUrl: "https://stripe.com/privacy",
    dpa: true,
  },
  {
    name: "Resend",
    purpose: "Transactional email",
    location: "USA",
    privacyUrl: "https://resend.com/legal/privacy-policy",
    dpa: true,
  },
];

function YourDataTab() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-white font-semibold text-base">Data we collect about you</h2>
        <p className="text-white/60 text-sm">
          The table below lists every category of personal data we hold, why we hold it, and how long we keep it.
        </p>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-sm border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2.5 pr-4 text-white/50 font-medium text-xs uppercase tracking-wider">Category</th>
              <th className="text-left py-2.5 pr-4 text-white/50 font-medium text-xs uppercase tracking-wider">Examples</th>
              <th className="text-left py-2.5 pr-4 text-white/50 font-medium text-xs uppercase tracking-wider">Purpose</th>
              <th className="text-left py-2.5 pr-4 text-white/50 font-medium text-xs uppercase tracking-wider">Retained</th>
              <th className="text-center py-2.5 pr-4 text-white/50 font-medium text-xs uppercase tracking-wider">Export</th>
              <th className="text-center py-2.5 text-white/50 font-medium text-xs uppercase tracking-wider">Delete</th>
            </tr>
          </thead>
          <tbody>
            {DATA_CATEGORIES.map((row) => (
              <tr key={row.category} className="border-b border-white/5">
                <td className="py-3 pr-4 text-white/80 font-medium align-top whitespace-nowrap">{row.category}</td>
                <td className="py-3 pr-4 text-white/50 align-top">{row.examples}</td>
                <td className="py-3 pr-4 text-white/50 align-top">{row.purpose}</td>
                <td className="py-3 pr-4 text-white/50 align-top">{row.retention}</td>
                <td className="py-3 pr-4 text-center align-top">
                  {row.canExport ? (
                    <span className="text-green-400" aria-label="Can export">✓</span>
                  ) : (
                    <span className="text-white/25" aria-label="Cannot export">—</span>
                  )}
                </td>
                <td className="py-3 text-center align-top">
                  {row.canDelete ? (
                    <span className="text-green-400" aria-label="Can delete">✓</span>
                  ) : (
                    <span className="text-white/25" aria-label="Cannot delete — legal hold">*</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-white/30 text-xs mt-2">* Cannot be deleted due to legal or security obligations (fraud prevention, tax records).</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-semibold text-base">Your rights</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { right: "Access (Art. 15 GDPR)", desc: "Request a copy of all personal data we hold about you." },
            { right: "Rectification (Art. 16)", desc: "Correct inaccurate data — most profile data you can update directly in Settings." },
            { right: "Erasure (Art. 17)", desc: "Request deletion of your account and associated personal data (subject to legal holds)." },
            { right: "Portability (Art. 20)", desc: "Receive your data in a structured, machine-readable format (JSON)." },
            { right: "Restriction (Art. 18)", desc: "Request we limit processing while a dispute is resolved." },
            { right: "Objection (Art. 21)", desc: "Object to processing based on legitimate interests, including profiling." },
            { right: "CCPA — Do Not Sell", desc: "California residents may opt out of sale of personal information." },
            { right: "CCPA — Know & Delete", desc: "California residents may request disclosure of categories collected and deletion." },
          ].map(({ right, desc }) => (
            <div key={right} className="p-3 rounded-lg bg-white/4 border border-white/8">
              <p className="text-white/80 font-medium text-sm">{right}</p>
              <p className="text-white/50 text-xs mt-1">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-white/50 text-sm">
          To exercise any of these rights, use the{" "}
          <button
            onClick={() => {}}
            className="text-white/80 underline underline-offset-2 hover:text-white"
          >
            Request Center tab
          </button>{" "}
          or email{" "}
          <a href="mailto:privacy@chartaalba.com" className="text-white/80 underline underline-offset-2 hover:text-white">
            privacy@chartaalba.com
          </a>. We respond within <strong className="text-white/80">30 days</strong> (GDPR) or{" "}
          <strong className="text-white/80">45 days</strong> (CCPA).
        </p>
      </div>
    </div>
  );
}

function OurPracticesTab() {
  return (
    <div className="space-y-8 text-sm">

      <section className="space-y-3">
        <h2 className="text-white font-semibold text-base">Legal bases for processing (GDPR)</h2>
        <div className="space-y-3">
          {[
            {
              basis: "Contract (Art. 6(1)(b))",
              use: "Providing your account, processing purchases, delivering Points, sending receipts",
            },
            {
              basis: "Legitimate interests (Art. 6(1)(f))",
              use: "Security monitoring, fraud prevention, login history, rate limiting, improving the platform",
            },
            {
              basis: "Legal obligation (Art. 6(1)(c))",
              use: "Retaining transaction records for tax and financial regulations (7 years)",
            },
            {
              basis: "Consent (Art. 6(1)(a))",
              use: "Marketing emails (opt-in only), analytics, personalisation beyond what's necessary for the service",
            },
          ].map(({ basis, use }) => (
            <div key={basis} className="p-3 rounded-lg bg-white/4 border border-white/8">
              <p className="text-white/80 font-medium">{basis}</p>
              <p className="text-white/55 mt-1">{use}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-white font-semibold text-base">Third-party processors</h2>
        <p className="text-white/55">
          We share data only with processors who are necessary to operate the platform. We require all processors
          to protect your data to at least the same standard as us.
        </p>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2.5 pr-4 text-white/50 font-medium text-xs uppercase tracking-wider">Processor</th>
                <th className="text-left py-2.5 pr-4 text-white/50 font-medium text-xs uppercase tracking-wider">Purpose</th>
                <th className="text-left py-2.5 pr-4 text-white/50 font-medium text-xs uppercase tracking-wider">Location</th>
                <th className="text-center py-2.5 text-white/50 font-medium text-xs uppercase tracking-wider">DPA</th>
              </tr>
            </thead>
            <tbody>
              {THIRD_PARTIES.map((p) => (
                <tr key={p.name} className="border-b border-white/5">
                  <td className="py-3 pr-4 text-white/80 font-medium align-top">
                    <a href={p.privacyUrl} target="_blank" rel="noopener noreferrer"
                      className="hover:text-white underline underline-offset-2">{p.name}</a>
                  </td>
                  <td className="py-3 pr-4 text-white/55 align-top">{p.purpose}</td>
                  <td className="py-3 pr-4 text-white/55 align-top">{p.location}</td>
                  <td className="py-3 text-center align-top">
                    {p.dpa ? (
                      <span className="text-green-400" aria-label="DPA in place">✓</span>
                    ) : (
                      <span className="text-white/30" aria-label="No formal DPA">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-white/40 text-xs">
          DPA = Data Processing Agreement. Where transfers occur outside the EEA/UK, we rely on Standard
          Contractual Clauses (SCCs) or equivalent transfer mechanisms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-white font-semibold text-base">Cookies & tracking</h2>
        <p className="text-white/55">
          We use <strong className="text-white/80">essential cookies only</strong>. These are strictly necessary
          for authentication (session token) and security (CSRF protection). We do not use:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-white/55">
          <li>Third-party advertising or tracking cookies</li>
          <li>Analytics pixels (e.g. Google Analytics, Meta Pixel)</li>
          <li>Fingerprinting or cross-site tracking</li>
        </ul>
        <p className="text-white/55">
          Essential cookies do not require consent under ePrivacy Directive Recital 66. You can delete all cookies
          by clearing your browser data or deleting your account.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-white font-semibold text-base">Security measures</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-white/55">
          <li>Passwords: bcrypt, cost factor 12 — never stored in plaintext</li>
          <li>Sessions: JWT signed with a secret of minimum 32 characters, 30-day expiry</li>
          <li>TOTP secrets (founder accounts): AES-256-GCM encrypted at rest</li>
          <li>API keys: SHA-256 hashed at rest; only the prefix is shown in the UI</li>
          <li>Database queries: parameterised via Drizzle ORM — no string concatenation</li>
          <li>Transport: TLS 1.2+ enforced on all endpoints</li>
          <li>Account lockout after 10 failed login attempts (30-minute lock)</li>
          <li>Immutable audit log with DB-level trigger preventing modification or deletion</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-white font-semibold text-base">Data breach notification</h2>
        <p className="text-white/55">
          In the event of a personal data breach that is likely to result in a high risk to your rights and
          freedoms, we will notify affected users without undue delay and in any case within 72 hours of
          becoming aware, as required by GDPR Article 33/34. We will also notify the relevant supervisory
          authority where required.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-white font-semibold text-base">Children&apos;s data</h2>
        <p className="text-white/55">
          Charta Alba is not directed at children under 13. We do not knowingly collect personal data from
          children under 13. If you believe a child under 13 has provided us with personal data, contact us
          at <a href="mailto:privacy@chartaalba.com" className="text-white/80 hover:text-white underline underline-offset-2">
            privacy@chartaalba.com
          </a> and we will delete it promptly.
        </p>
      </section>

    </div>
  );
}

type RequestType = "download" | "delete" | "correct" | "opt_out_analytics" | "ccpa_do_not_sell" | "other";

function RequestCenterTab() {
  const [type, setType] = useState<RequestType>("download");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const REQUEST_TYPES: { value: RequestType; label: string; desc: string }[] = [
    { value: "download", label: "Download my data", desc: "Receive a JSON export of all personal data we hold about you (GDPR Art. 20 / CCPA Know)" },
    { value: "delete", label: "Delete my account & data", desc: "Erase your account and all associated personal data (GDPR Art. 17 / CCPA Delete). Does not affect legally-required records." },
    { value: "correct", label: "Correct inaccurate data", desc: "Request correction of incorrect personal data (GDPR Art. 16). Most fields can be updated directly in Settings." },
    { value: "opt_out_analytics", label: "Opt out of analytics", desc: "Stop all analytics and personalisation processing beyond what is strictly necessary to operate the service." },
    { value: "ccpa_do_not_sell", label: "Do Not Sell My Personal Information", desc: "California residents: opt out of the sale or sharing of your personal information (CCPA § 1798.120)." },
    { value: "other", label: "Other privacy request", desc: "Restriction, objection to processing, or another request not listed above." },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please provide your email address so we can contact you.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/privacy/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, email: email.trim(), notes: notes.trim() }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Request failed");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-white font-semibold text-lg">Request submitted</h3>
        <p className="text-white/55 text-sm max-w-sm mx-auto">
          We&apos;ve received your request and will respond to <strong className="text-white/80">{email}</strong> within{" "}
          {type === "ccpa_do_not_sell" ? "15 business days" : "30 days"}.
        </p>
        <p className="text-white/40 text-xs">Reference ID will be included in our email response.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-white font-semibold text-base">Submit a privacy request</h2>
        <p className="text-white/55 text-sm">
          We process all requests within <strong className="text-white/80">30 days</strong> (GDPR) or{" "}
          <strong className="text-white/80">45 days</strong> (CCPA). We may ask you to verify your identity before
          completing the request.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>

        <fieldset className="space-y-2">
          <legend className="text-white/70 text-sm font-medium">Request type</legend>
          <div className="space-y-2">
            {REQUEST_TYPES.map(({ value, label, desc }) => (
              <label
                key={value}
                className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  type === value ? "border-white/30 bg-white/6" : "border-white/8 bg-white/3 hover:bg-white/5"
                }`}
              >
                <input
                  type="radio"
                  name="requestType"
                  value={value}
                  checked={type === value}
                  onChange={() => setType(value)}
                  className="mt-0.5 accent-white"
                />
                <div>
                  <p className="text-white/85 text-sm font-medium">{label}</p>
                  <p className="text-white/45 text-xs mt-0.5">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <label htmlFor="req-email" className="text-white/70 text-sm font-medium block">
            Email address <span className="text-red-400" aria-label="required">*</span>
          </label>
          <input
            id="req-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-white/5 border border-white/12 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
          />
          <p className="text-white/35 text-xs">Used only to send you the response to this request.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="req-notes" className="text-white/70 text-sm font-medium block">
            Additional details <span className="text-white/35 font-normal">(optional)</span>
          </label>
          <textarea
            id="req-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Any specific data fields, date ranges, or other context that helps us process your request..."
            className="w-full bg-white/5 border border-white/12 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 resize-none"
            maxLength={2000}
          />
        </div>

        {error && (
          <p role="alert" className="text-red-400 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-black font-semibold text-sm py-3 rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Submitting…" : "Submit Request"}
        </button>

        <p className="text-white/30 text-xs text-center">
          Alternatively, email us at{" "}
          <a href="mailto:privacy@chartaalba.com" className="text-white/50 hover:text-white underline underline-offset-2">
            privacy@chartaalba.com
          </a>
        </p>
      </form>
    </div>
  );
}

export default function DataPage() {
  const [activeTab, setActiveTab] = useState<Tab>("your-data");

  const tabs: { id: Tab; label: string }[] = [
    { id: "your-data", label: "Your Data" },
    { id: "our-practices", label: "Our Practices" },
    { id: "request", label: "Request Center" },
  ];

  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14" id="main-content">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-white text-3xl font-bold tracking-tight">Your Data & Privacy</h1>
          <p className="text-white/45 text-sm mt-2">
            Understand what data we collect, how we protect it, and exercise your rights under GDPR and CCPA.
          </p>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="Data & privacy sections" className="flex gap-1 p-1 rounded-xl bg-white/5 mb-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 text-sm rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-black"
                  : "text-white/55 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === "your-data" && <YourDataTab />}
          {activeTab === "our-practices" && <OurPracticesTab />}
          {activeTab === "request" && <RequestCenterTab />}
        </div>

        <div className="mt-12 pt-8 border-t border-white/8 flex flex-wrap gap-4 text-sm">
          <Link href="/privacy" className="text-white/40 hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="text-white/40 hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/accessibility" className="text-white/40 hover:text-white transition-colors">Accessibility</Link>
        </div>
      </div>
    </main>
  );
}
