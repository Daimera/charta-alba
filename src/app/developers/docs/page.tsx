import Link from "next/link";

const BASE = "https://chartaalba.com";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-white/8 pb-10 mb-10 last:border-b-0 last:mb-0 last:pb-0">
      <h2 className="text-white font-bold text-xl mb-5">{title}</h2>
      {children}
    </section>
  );
}

function Endpoint({ method, path, desc, params, response }: {
  method: string; path: string; desc: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  response: string;
}) {
  const methodColors: Record<string, string> = {
    GET: "text-green-400 bg-green-500/10 border-green-500/20",
  };
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${methodColors[method] ?? "text-white/60 bg-white/5 border-white/10"}`}>
          {method}
        </span>
        <code className="text-white text-sm font-mono">{path}</code>
      </div>
      <p className="text-white/50 text-sm mb-3">{desc}</p>

      {params && params.length > 0 && (
        <div className="mb-3">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Parameters</p>
          <div className="space-y-1.5">
            {params.map((p) => (
              <div key={p.name} className="flex flex-wrap items-start gap-2 text-xs">
                <code className="text-white/80 font-mono bg-white/5 px-1.5 py-0.5 rounded">{p.name}</code>
                <span className="text-white/30">{p.type}</span>
                {p.required && <span className="text-amber-400/70 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">required</span>}
                <span className="text-white/40 flex-1">{p.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Example Response</p>
        <pre className="bg-[#0d0d0d] border border-white/8 rounded-xl p-4 text-xs text-white/60 font-mono leading-relaxed overflow-x-auto whitespace-pre">
          {response}
        </pre>
      </div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-sm text-white/40 mb-4">
            <Link href="/developers" className="hover:text-white transition-colors">Developers</Link>
            <span>/</span>
            <span>API Reference</span>
          </div>
          <h1 className="text-white text-3xl font-bold tracking-tight">API Reference</h1>
          <p className="text-white/45 mt-2">REST API for accessing Charta Alba research data. Base URL: <code className="text-white/70 font-mono text-sm bg-white/5 px-1.5 py-0.5 rounded">{BASE}/api/v1</code></p>
        </div>

        {/* Authentication */}
        <Section title="Authentication">
          <p className="text-white/50 text-sm mb-4">All API requests require a Bearer token in the <code className="text-white/70 font-mono text-xs bg-white/5 px-1 py-0.5 rounded">Authorization</code> header.</p>
          <pre className="bg-[#0d0d0d] border border-white/8 rounded-xl p-4 text-xs text-white/60 font-mono leading-relaxed overflow-x-auto whitespace-pre mb-4">
{`Authorization: Bearer ca_live_your_api_key_here

# Example with curl:
curl "${BASE}/api/v1/papers" \\
  -H "Authorization: Bearer ca_live_your_api_key_here"`}
          </pre>
          <p className="text-white/40 text-sm">
            Get your API key at <Link href="/developers/dashboard" className="text-white/70 hover:text-white underline transition-colors">/developers/dashboard</Link>.
          </p>
        </Section>

        {/* Endpoints */}
        <Section title="Endpoints">
          <Endpoint
            method="GET"
            path="/api/v1/papers"
            desc="Returns a paginated list of AI research papers with AI-generated summaries."
            params={[
              { name: "limit", type: "integer", required: false, description: "Number of results (max per tier: free=10, starter=50, pro=200)" },
              { name: "offset", type: "integer", required: false, description: "Pagination offset" },
              { name: "category", type: "string", required: false, description: "Filter by arXiv category, e.g. cs.AI" },
              { name: "search", type: "string", required: false, description: "Full-text search on title and abstract" },
              { name: "sort", type: "string", required: false, description: "trending (default) | recent | top" },
            ]}
            response={`{
  "data": [
    {
      "id": "2504.01234",
      "title": "Scaling Laws for Next-Token Prediction",
      "authors": ["Smith, J.", "Doe, A."],
      "abstract": "We investigate scaling laws...",
      "tldr": "New scaling law outperforms Chinchilla...",
      "tags": ["cs.AI", "transformers", "scaling"],
      "eli5Summary": "Imagine training a bigger...",
      "replicationStatus": "replicated",
      "likeCount": 342,
      "arxivUrl": "https://arxiv.org/abs/2504.01234",
      "publishedAt": "2026-04-01T00:00:00Z",
      "readTime": 45
    }
  ],
  "meta": { "limit": 10, "offset": 0, "count": 10 }
}`}
          />

          <Endpoint
            method="GET"
            path="/api/v1/papers/{id}"
            desc="Returns full detail for a single paper including citation graph."
            params={[
              { name: "id", type: "string", required: true, description: "arXiv paper ID, e.g. 2504.01234" },
            ]}
            response={`{
  "data": {
    "id": "2504.01234",
    "title": "Scaling Laws for Next-Token Prediction",
    "authors": ["Smith, J."],
    "abstract": "We investigate...",
    "tldr": "New scaling law...",
    "tags": ["cs.AI", "transformers"],
    "likeCount": 342,
    "publishedAt": "2026-04-01T00:00:00Z",
    "citedCardIds": ["3fa85f64-...", "6ba7b810-..."]
  }
}`}
          />

          <Endpoint
            method="GET"
            path="/api/v1/papers/trending"
            desc="Returns the most-liked papers within a time window."
            params={[
              { name: "period", type: "string", required: false, description: "day | week (default) | month" },
              { name: "limit", type: "integer", required: false, description: "Number of results (max per tier)" },
            ]}
            response={`{
  "data": [ { "id": "2504.01234", "title": "...", "likeCount": 1204 } ],
  "meta": { "period": "week", "limit": 10 }
}`}
          />

          <Endpoint
            method="GET"
            path="/api/v1/videos"
            desc="Returns the latest research explainer videos."
            params={[
              { name: "limit", type: "integer", required: false, description: "Number of results" },
              { name: "offset", type: "integer", required: false, description: "Pagination offset" },
            ]}
            response={`{
  "data": [
    {
      "id": "3fa85f64-...",
      "title": "GPT-4 Explained in 60 Seconds",
      "videoUrl": "https://youtube.com/...",
      "likeCount": 89,
      "authorName": "Jane Smith",
      "relatedPaperId": "2504.01234",
      "createdAt": "2026-04-01T12:00:00Z"
    }
  ]
}`}
          />

          <Endpoint
            method="GET"
            path="/api/v1/search"
            desc="Search across papers and videos. Returns mixed results with a type field."
            params={[
              { name: "q", type: "string", required: true, description: "Search query" },
              { name: "limit", type: "integer", required: false, description: "Max results per type" },
            ]}
            response={`{
  "data": [
    { "type": "paper", "id": "2504.01234", "title": "..." },
    { "type": "video", "id": "3fa85f64-...", "title": "..." }
  ],
  "meta": { "query": "transformer", "count": 8 }
}`}
          />

          <Endpoint
            method="GET"
            path="/api/v1/stats"
            desc="Returns platform-wide statistics and trending topic tags."
            response={`{
  "data": {
    "totalPapers": 14820,
    "totalVideos": 342,
    "papersToday": 47,
    "trendingTags": ["llm", "reasoning", "rlhf", "multimodal", "scaling"]
  }
}`}
          />
        </Section>

        {/* Rate Limiting */}
        <Section title="Rate Limiting">
          <p className="text-white/50 text-sm mb-4">Rate limits are enforced per API key. All responses include these headers:</p>
          <pre className="bg-[#0d0d0d] border border-white/8 rounded-xl p-4 text-xs text-white/60 font-mono leading-relaxed overflow-x-auto whitespace-pre mb-5">
{`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1748822400`}
          </pre>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/8">
                  {["Tier", "Daily", "Monthly", "Max results/call"].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 text-white/40 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-white/50">
                {[
                  ["Free", "100", "1,000", "10"],
                  ["Starter", "1,000", "10,000", "50"],
                  ["Pro", "10,000", "100,000", "200"],
                  ["Enterprise", "Unlimited", "Unlimited", "1,000"],
                ].map(([tier, ...rest]) => (
                  <tr key={tier} className="border-b border-white/5">
                    <td className="py-2 pr-4 text-white/70">{tier}</td>
                    {rest.map((v, i) => <td key={i} className="py-2 pr-4">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Error Codes */}
        <Section title="Error Codes">
          <div className="space-y-2">
            {[
              { code: "401", title: "Unauthorized", desc: "Missing or invalid API key. Check your Authorization header." },
              { code: "403", title: "Forbidden", desc: "Your plan does not include access to this feature." },
              { code: "404", title: "Not Found", desc: "The requested resource does not exist." },
              { code: "429", title: "Too Many Requests", desc: "Rate limit exceeded. Check X-RateLimit-Reset and Retry-After headers." },
              { code: "500", title: "Internal Server Error", desc: "An unexpected error occurred. Contact support if it persists." },
            ].map(({ code, title, desc }) => (
              <div key={code} className="flex gap-4 p-3 rounded-xl bg-white/3 border border-white/6">
                <code className="text-amber-400 font-mono text-sm font-bold shrink-0 w-8">{code}</code>
                <div>
                  <p className="text-white/80 text-sm font-medium">{title}</p>
                  <p className="text-white/40 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Terms */}
        <div className="p-4 rounded-xl bg-white/4 border border-white/8 text-sm">
          <p className="text-white/50">
            By using this API you agree to the{" "}
            <Link href="/developers/terms" className="text-white/80 hover:text-white underline transition-colors">API Terms of Service</Link>.
            Attribution is required: display &quot;Powered by Charta Alba&quot; in your product.
          </p>
        </div>
      </div>
    </main>
  );
}
