# Charta Alba — AI Agent Standing Orders

## Product Vision
Charta Alba is a mobile-first vertical-scroll app that transforms AI/ML research papers into
addictive 15–90 second explainers (TikTok-style feed). Users swipe through paper summaries,
like/bookmark items, and follow topics. Daily seeding pulls fresh arXiv papers and runs them
through Claude to generate consumer-grade explainer cards.

## Tech Stack (MVP)
- **Next.js 14** + TypeScript (strict mode), App Router, `src/` directory layout
- **Neon** (serverless Postgres) — database via `@neondatabase/serverless` HTTP driver
- **Drizzle ORM** — type-safe queries; schema in `src/lib/db/schema.ts`
- **NextAuth.js v5** — authentication (Google OAuth + credentials); config in `src/lib/auth.ts`
- **Claude API** (`claude-sonnet-4-6`) — paper summarisation pipeline
- **Vercel** (free tier) — deployment, cron triggers via `vercel.json`
- **arXiv API** — daily paper seeding, no API key required

## Directory Layout
```
src/
  app/           # Next.js App Router pages & API routes
  components/    # Reusable React components
  lib/
    db/          # Drizzle client (index.ts) and schema (schema.ts)
    auth.ts      # NextAuth config
    claude.ts    # Claude API client
    arxiv.ts     # arXiv fetcher
  types/         # Shared TypeScript types
scripts/         # One-off / seeding scripts (run with tsx)
supabase/
  migrations/    # SQL migration files (timestamped)
drizzle/         # Generated Drizzle migration files (drizzle-kit output)
```

## Standing Orders
1. **TypeScript strict mode** — no `any`, no `@ts-ignore` without a comment.
2. **RLS everywhere** — every Neon table has RLS enabled. The service connection used by
   server-side code bypasses RLS; ownership checks are enforced in API routes via
   NextAuth session before any write.
3. **Mobile-first** — Tailwind breakpoints start at `sm:`. Default styles target 390px viewport.
4. **No over-engineering** — build what the task asks, nothing more.
5. **Environment variables** — never hard-code secrets. Use `.env.local` locally;
   Vercel env vars in production. Required vars listed in `.env.example`.
6. **Migrations** — all schema changes go in `supabase/migrations/` with a timestamped
   filename (`YYYYMMDDHHMMSS_description.sql`). Never mutate existing migrations.
7. **Seeding script** — `scripts/seed-arxiv.ts` fetches today's cs.AI + cs.LG papers,
   upserts into `papers`, and queues summarisation jobs.
8. **Claude summaries** — always request structured JSON output. Validate with Zod before
   inserting into the DB.
9. **Commits** — conventional commits (`feat:`, `fix:`, `chore:`, etc.). Keep PRs small.
10. **Tests** — unit test pure functions in `src/lib/`. Integration tests for API routes.

## Key Data Model (summary)
- `papers` — raw arXiv metadata (id, title, abstract, authors, categories, published_at)
- `cards` — processed explainer cards linked to a paper (headline, hook, body, tldr, tags)
- `users` — NextAuth users table (id, email, name, image, password_hash)
- `profiles` — extended user profile linked to `users`
- `likes` / `bookmarks` — user interactions on cards
- `follows` — user follows a topic/category

## Environment Variables Required
```
DATABASE_URL=          # Neon pooled connection string
NEXTAUTH_SECRET=       # random secret for JWT signing (min 32 chars)
NEXTAUTH_URL=          # base URL (http://localhost:3000 locally)
GOOGLE_CLIENT_ID=      # Google OAuth app
GOOGLE_CLIENT_SECRET=
ANTHROPIC_API_KEY=
CRON_SECRET=           # shared secret for Vercel cron → API route auth
```
