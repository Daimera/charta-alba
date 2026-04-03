import { db } from "@/lib/db";
import { papers, videos, cards } from "@/lib/db/schema";
import { authenticateApiKey, recordUsage, rateLimitHeaders } from "@/lib/api-auth";
import { count, desc, gte, sql } from "drizzle-orm";

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

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [
    [totalPapersRow],
    [totalVideosRow],
    [papersTodayRow],
    trendingTagRows,
  ] = await Promise.all([
    db.select({ count: count() }).from(papers),
    db.select({ count: count() }).from(videos),
    db.select({ count: count() }).from(papers).where(gte(papers.createdAt, todayStart.toISOString())),
    db
      .select({ tag: sql<string>`unnest(${cards.tags})`, cnt: sql<number>`count(*)` })
      .from(cards)
      .groupBy(sql`unnest(${cards.tags})`)
      .orderBy(desc(sql`count(*)`))
      .limit(10),
  ]);

  const ms = Date.now() - start;
  recordUsage(key.id, "/api/v1/stats", 200, ms, ip);

  return Response.json({
    data: {
      totalPapers: totalPapersRow.count,
      totalVideos: totalVideosRow.count,
      papersToday: papersTodayRow.count,
      trendingTags: trendingTagRows.map((r) => r.tag).filter(Boolean),
    },
  }, { headers: rateLimitHeaders(key) });
}
