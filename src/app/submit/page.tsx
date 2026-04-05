"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SubmissionType = "paper" | "white_paper" | "discovery" | "dataset";

interface FormState {
  title: string;
  authors: string;
  abstract: string;
  externalUrl: string;
  pdfUrl: string;
  category: string;
  // Paper-specific
  doi: string;
  journalName: string;
  peerReviewed: boolean;
  // White paper
  organization: string;
  versionNumber: string;
  // Discovery
  fieldOfDiscovery: string;
  methodology: string;
  // Dataset
  datasetSize: string;
  datasetFormat: string;
  datasetLicense: string;
}

const CATEGORIES = [
  "cs.AI", "cs.LG", "cs.CV", "cs.CL", "cs.RO", "cs.NE",
  "stat.ML", "math.OC", "q-bio.NC", "physics.comp-ph",
  "Other",
];

const TABS: { id: SubmissionType; label: string; desc: string }[] = [
  { id: "paper",       label: "Research Paper", desc: "Peer-reviewed or preprint academic paper" },
  { id: "white_paper", label: "White Paper",     desc: "Industry or organizational research report" },
  { id: "discovery",   label: "Discovery",       desc: "Experimental finding or breakthrough" },
  { id: "dataset",     label: "Dataset",         desc: "Research dataset for the community" },
];

const empty: FormState = {
  title: "", authors: "", abstract: "", externalUrl: "", pdfUrl: "", category: "",
  doi: "", journalName: "", peerReviewed: false,
  organization: "", versionNumber: "",
  fieldOfDiscovery: "", methodology: "",
  datasetSize: "", datasetFormat: "", datasetLicense: "",
};

export default function SubmitPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<SubmissionType>("paper");
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (status === "loading") {
    return (
      <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex items-center justify-center" id="main-content">
        <div className="text-center max-w-xs">
          <p className="text-white/60 mb-4">Sign in to submit research.</p>
          <Link href="/auth/signin" className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors">
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  function set(k: keyof FormState, v: string | boolean) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.authors.trim()) { setError("Authors are required."); return; }
    if (!form.abstract.trim()) { setError("Abstract is required."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, submissionType: tab }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? "Submission failed");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-dvh bg-[#0a0a0a] pt-14 flex items-center justify-center" id="main-content">
        <div className="text-center max-w-sm space-y-4">
          <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold">Submission received</h2>
          <p className="text-white/55 text-sm">
            Our AI is processing your submission. You&apos;ll be notified when it&apos;s published.
            This usually takes a few minutes.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setSubmitted(false); setForm(empty); }} className="px-4 py-2 text-sm text-white/60 hover:text-white border border-white/10 rounded-lg transition-colors">
              Submit another
            </button>
            <button onClick={() => router.push("/")} className="px-4 py-2 text-sm bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-colors">
              Go to feed
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14" id="main-content">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-white text-2xl font-bold">Submit Research</h1>
          <p className="text-white/45 text-sm mt-1">
            Share a paper, white paper, discovery, or dataset with the community.
            Our AI will generate an explainer card automatically.
          </p>
        </div>

        {/* Type tabs */}
        <div role="tablist" className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`p-3 rounded-xl border text-left transition-colors ${
                tab === t.id ? "border-white/30 bg-white/8" : "border-white/8 bg-white/3 hover:bg-white/5"
              }`}
            >
              <p className={`text-sm font-medium ${tab === t.id ? "text-white" : "text-white/65"}`}>{t.label}</p>
              <p className="text-white/30 text-xs mt-0.5 leading-tight">{t.desc}</p>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Common fields */}
          <Field label="Title *" hint="Max 300 characters">
            <input
              type="text" maxLength={300} required
              value={form.title} onChange={e => set("title", e.target.value)}
              className="input-field"
              placeholder="Full title of the work"
            />
          </Field>

          <Field label="Authors *" hint="Comma-separated list">
            <input
              type="text" required
              value={form.authors} onChange={e => set("authors", e.target.value)}
              className="input-field"
              placeholder="Jane Smith, John Doe, …"
            />
          </Field>

          <Field label="Abstract *" hint="Max 5000 characters">
            <textarea
              rows={5} maxLength={5000} required
              value={form.abstract} onChange={e => set("abstract", e.target.value)}
              className="input-field resize-none"
              placeholder="The full abstract or summary of the work…"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <select value={form.category} onChange={e => set("category", e.target.value)} className="input-field">
                <option value="">Select category…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="External URL" hint="Link to paper / source">
              <input
                type="url"
                value={form.externalUrl} onChange={e => set("externalUrl", e.target.value)}
                className="input-field"
                placeholder="https://arxiv.org/abs/…"
              />
            </Field>
          </div>

          <Field label="PDF URL" hint="Direct link to PDF (optional — improves AI summary quality)">
            <input
              type="url"
              value={form.pdfUrl} onChange={e => set("pdfUrl", e.target.value)}
              className="input-field"
              placeholder="https://arxiv.org/pdf/…"
            />
          </Field>

          {/* Type-specific fields */}
          {tab === "paper" && (
            <div className="space-y-4 p-4 rounded-xl bg-white/3 border border-white/8">
              <p className="text-white/40 text-xs uppercase tracking-wide">Research Paper Fields</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Journal / Venue">
                  <input type="text" value={form.journalName} onChange={e => set("journalName", e.target.value)} className="input-field" placeholder="NeurIPS 2025" />
                </Field>
                <Field label="DOI">
                  <input type="text" value={form.doi} onChange={e => set("doi", e.target.value)} className="input-field" placeholder="10.1234/example" />
                </Field>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.peerReviewed} onChange={e => set("peerReviewed", e.target.checked)} className="w-4 h-4 accent-white" />
                <span className="text-white/70 text-sm">Peer-reviewed publication</span>
              </label>
            </div>
          )}

          {tab === "white_paper" && (
            <div className="space-y-4 p-4 rounded-xl bg-white/3 border border-white/8">
              <p className="text-white/40 text-xs uppercase tracking-wide">White Paper Fields</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Organization">
                  <input type="text" value={form.organization} onChange={e => set("organization", e.target.value)} className="input-field" placeholder="Acme Research Labs" />
                </Field>
                <Field label="Version">
                  <input type="text" value={form.versionNumber} onChange={e => set("versionNumber", e.target.value)} className="input-field" placeholder="v1.2" />
                </Field>
              </div>
            </div>
          )}

          {tab === "discovery" && (
            <div className="space-y-4 p-4 rounded-xl bg-white/3 border border-white/8">
              <p className="text-white/40 text-xs uppercase tracking-wide">Discovery Fields</p>
              <Field label="Field of Discovery">
                <input type="text" value={form.fieldOfDiscovery} onChange={e => set("fieldOfDiscovery", e.target.value)} className="input-field" placeholder="Quantum Computing, Genomics, …" />
              </Field>
              <Field label="Methodology Summary">
                <textarea rows={3} value={form.methodology} onChange={e => set("methodology", e.target.value)} className="input-field resize-none" placeholder="Brief description of the experimental approach…" />
              </Field>
            </div>
          )}

          {tab === "dataset" && (
            <div className="space-y-4 p-4 rounded-xl bg-white/3 border border-white/8">
              <p className="text-white/40 text-xs uppercase tracking-wide">Dataset Fields</p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Size">
                  <input type="text" value={form.datasetSize} onChange={e => set("datasetSize", e.target.value)} className="input-field" placeholder="2.4 GB" />
                </Field>
                <Field label="Format">
                  <input type="text" value={form.datasetFormat} onChange={e => set("datasetFormat", e.target.value)} className="input-field" placeholder="CSV, Parquet, …" />
                </Field>
                <Field label="License">
                  <input type="text" value={form.datasetLicense} onChange={e => set("datasetLicense", e.target.value)} className="input-field" placeholder="CC BY 4.0" />
                </Field>
              </div>
            </div>
          )}

          {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Submitting…" : "Submit for Review"}
          </button>

          <p className="text-white/25 text-xs text-center">
            Submissions are reviewed by our AI and founder before publishing.
            By submitting you confirm you have the right to share this content.
          </p>
        </form>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 0.5rem;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
        }
        .input-field:focus {
          border-color: rgba(255,255,255,0.3);
        }
        .input-field::placeholder {
          color: rgba(255,255,255,0.25);
        }
        select.input-field option {
          background: #1a1a1a;
        }
      `}</style>
    </main>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-white/70 text-sm font-medium">
        {label}
        {hint && <span className="text-white/30 font-normal ml-1.5">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}
