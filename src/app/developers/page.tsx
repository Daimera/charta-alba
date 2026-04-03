import Link from "next/link";

const PLANS = [
  {
    tier: "Free",
    price: "$0",
    period: "forever",
    daily: "100 req/day",
    monthly: "1,000 req/month",
    results: "10 results/call",
    features: ["Papers feed", "Basic search", "Community support"],
    cta: "Get started free",
    highlight: false,
  },
  {
    tier: "Starter",
    price: "$49",
    period: "/month",
    daily: "1,000 req/day",
    monthly: "10,000 req/month",
    results: "50 results/call",
    features: ["Everything in Free", "Full-text search", "Email support"],
    cta: "Start building",
    highlight: false,
  },
  {
    tier: "Pro",
    price: "$199",
    period: "/month",
    daily: "10,000 req/day",
    monthly: "100,000 req/month",
    results: "200 results/call",
    features: ["Everything in Starter", "Citation graph", "Priority support"],
    cta: "Go Pro",
    highlight: true,
  },
  {
    tier: "Enterprise",
    price: "Custom",
    period: "",
    daily: "Unlimited",
    monthly: "Unlimited",
    results: "1,000 results/call",
    features: ["Everything in Pro", "Webhooks", "Dedicated support", "SLA"],
    cta: "Contact us",
    highlight: false,
  },
];

const CODE_EXAMPLE = `curl -X GET "https://chartaalba.com/api/v1/papers/trending?period=week&limit=5" \\
  -H "Authorization: Bearer ca_live_your_api_key_here"

# Response
{
  "data": [
    {
      "id": "2504.01234",
      "title": "Attention Is All You Need: Revisited",
      "authors": ["Smith, J.", "Doe, A."],
      "tldr": "A new approach to transformer scaling...",
      "tags": ["cs.AI", "transformers", "llm"],
      "likeCount": 1204,
      "publishedAt": "2026-04-01T00:00:00Z"
    }
  ],
  "meta": { "period": "week", "limit": 5 }
}`;

export default function DevelopersPage() {
  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          Public API · Beta
        </div>
        <h1 className="text-white text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-4">
          Build with the world&apos;s fastest-growing<br />
          <span className="text-white/60">research knowledge graph</span>
        </h1>
        <p className="text-white/50 text-lg max-w-xl mx-auto mb-8">
          Access real-time AI research papers, AI-generated summaries, and citation graphs via a clean REST API.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/developers/dashboard"
            className="px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition-colors"
          >
            Get API Key
          </Link>
          <Link
            href="/developers/docs"
            className="px-6 py-3 rounded-xl bg-white/8 border border-white/10 text-white font-semibold hover:bg-white/12 transition-colors"
          >
            View Docs
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-blue-400">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                </svg>
              ),
              title: "Real-time papers",
              desc: "Daily-updated feed from arXiv cs.AI and cs.LG. New papers available within hours of submission.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-violet-400">
                  <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                </svg>
              ),
              title: "AI summaries",
              desc: "Claude-generated TLDRs, ELI5 explanations, and key insights — ready to embed in your product.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-amber-400">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              ),
              title: "Citation graph",
              desc: "Explore paper relationships and citation networks. Available on Pro and Enterprise plans.",
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="p-5 rounded-2xl bg-white/4 border border-white/8">
              <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center mb-3">
                {icon}
              </div>
              <h3 className="text-white font-semibold text-sm mb-1.5">{title}</h3>
              <p className="text-white/45 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Code example */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-white font-bold text-xl mb-4">Simple, powerful API</h2>
        <pre className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-5 text-xs text-white/70 leading-relaxed overflow-x-auto font-mono whitespace-pre-wrap">
          {CODE_EXAMPLE}
        </pre>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <h2 className="text-white font-bold text-2xl mb-2 text-center">Simple pricing</h2>
        <p className="text-white/40 text-sm text-center mb-8">Start free. Scale as you grow. No hidden fees.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.tier}
              className={`rounded-2xl p-5 flex flex-col gap-4 ${
                plan.highlight
                  ? "bg-white text-black border border-white"
                  : "bg-white/4 border border-white/8 text-white"
              }`}
            >
              <div>
                <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${plan.highlight ? "text-black/50" : "text-white/40"}`}>
                  {plan.tier}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  {plan.period && <span className={`text-xs ${plan.highlight ? "text-black/50" : "text-white/40"}`}>{plan.period}</span>}
                </div>
              </div>
              <div className={`text-xs space-y-1 ${plan.highlight ? "text-black/60" : "text-white/40"}`}>
                <p>{plan.daily}</p>
                <p>{plan.monthly}</p>
                <p>{plan.results}</p>
              </div>
              <ul className={`text-xs space-y-1.5 flex-1 ${plan.highlight ? "text-black/80" : "text-white/60"}`}>
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.tier === "Enterprise" ? "mailto:support@chartaalba.com" : "/developers/dashboard"}
                className={`w-full py-2 rounded-lg text-xs font-semibold text-center transition-colors ${
                  plan.highlight
                    ? "bg-black text-white hover:bg-black/80"
                    : "bg-white/8 border border-white/10 hover:bg-white/12"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center mt-6 text-white/30 text-xs">
          All plans include access to all endpoints. Limits reset monthly.{" "}
          <Link href="/developers/terms" className="underline hover:text-white/60 transition-colors">API Terms of Service</Link>
        </p>
      </section>
    </main>
  );
}
