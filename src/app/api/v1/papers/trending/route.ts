import { db } from "@/lib/db";
import { papers, cards } from "@/lib/db/schema";
import { authenticateApiKey, recordUsage, rateLimitHeaders, TIER_LIMITS } from "@/lib/api-auth";
import { eq, desc, gte, sql } from "drizzle-orm";

export async function GET(req: Request) {
  const start = Date.now();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? null;

  const auth = await authenticateApiKey(req);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, {
      status: auth.status,
      headers: auth.retryAfter ? { "Retry-After": String(auth.retryAfter) } : {},
    });
  }
  const { key } = auth;
  const limits = TIER_LIMITS[key.tier];

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "week";
  const rawLimit = Math.min(parseInt(searchParams.get("limit") ?? "20"), limits.results);

  const periodDays: Record<string, number> = { day: 1, week: 7, month: 30 };
  const days = periodDays[period] ?? 7;
  const since = new Date(Date.now() - days * 86400 * 1000).toISOString();

  const rows = await db
    .select({
      id: papers.id,
      title: papers.title,
      authors: papers.authors,
      publishedAt: papers.publishedAt,
      arxivUrl: papers.arxivUrl,
      tldr: cards.tldr,
      tags: cards.tags,
      likeCount: cards.likeCount,
      readTime: cards.readingTimeSeconds,
    })
    .from(cards)
    .innerJoin(papers, eq(papers.id, cards.paperId))
    .where(gte(cards.createdAt, since))
    .orderBy(desc(cards.likeCount))
    .limit(rawLimit);

  const ms = Date.now() - start;
  recordUsage(key.id, "/api/v1/papers/trending", 200, ms, ip);

  return Response.json({ data: rows, meta: { period, limit: rawLimit } }, {
    headers: rateLimitHeaders(key),
  });
}
