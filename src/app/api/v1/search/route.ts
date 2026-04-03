import { db } from "@/lib/db";
import { papers, cards, videos, users } from "@/lib/db/schema";
import { authenticateApiKey, recordUsage, rateLimitHeaders, TIER_LIMITS } from "@/lib/api-auth";
import { eq, ilike, or, desc } from "drizzle-orm";

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
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return Response.json({ error: "Query parameter 'q' is required" }, { status: 400, headers: rateLimitHeaders(key) });
  }
  const rawLimit = Math.min(parseInt(searchParams.get("limit") ?? "20"), limits.results);

  const [paperRows, videoRows] = await Promise.all([
    db
      .select({
        id: papers.id,
        title: papers.title,
        authors: papers.authors,
        publishedAt: papers.publishedAt,
        tldr: cards.tldr,
        tags: cards.tags,
        likeCount: cards.likeCount,
      })
      .from(papers)
      .leftJoin(cards, eq(cards.paperId, papers.id))
      .where(or(ilike(papers.title, `%${q}%`), ilike(papers.abstract, `%${q}%`)))
      .orderBy(desc(cards.likeCount))
      .limit(rawLimit),

    db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        videoUrl: videos.videoUrl,
        likeCount: videos.likeCount,
        authorName: users.name,
      })
      .from(videos)
      .leftJoin(users, eq(videos.userId, users.id))
      .where(or(ilike(videos.title, `%${q}%`), ilike(videos.description, `%${q}%`)))
      .orderBy(desc(videos.likeCount))
      .limit(rawLimit),
  ]);

  const results = [
    ...paperRows.map((r) => ({ type: "paper" as const, ...r })),
    ...videoRows.map((r) => ({ type: "video" as const, ...r })),
  ];

  const ms = Date.now() - start;
  recordUsage(key.id, "/api/v1/search", 200, ms, ip);

  return Response.json({ data: results, meta: { query: q, count: results.length } }, {
    headers: rateLimitHeaders(key),
  });
}
