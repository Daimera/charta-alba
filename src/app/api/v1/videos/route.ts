import { db } from "@/lib/db";
import { videos, users } from "@/lib/db/schema";
import { authenticateApiKey, recordUsage, rateLimitHeaders, TIER_LIMITS } from "@/lib/api-auth";
import { eq, desc } from "drizzle-orm";

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
  const rawLimit = Math.min(parseInt(searchParams.get("limit") ?? "20"), limits.results);
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0"));

  const rows = await db
    .select({
      id: videos.id,
      title: videos.title,
      description: videos.description,
      videoUrl: videos.videoUrl,
      likeCount: videos.likeCount,
      createdAt: videos.createdAt,
      relatedPaperId: videos.paperId,
      authorName: users.name,
      authorImage: users.image,
    })
    .from(videos)
    .leftJoin(users, eq(videos.userId, users.id))
    .orderBy(desc(videos.createdAt))
    .limit(rawLimit)
    .offset(offset);

  const ms = Date.now() - start;
  recordUsage(key.id, "/api/v1/videos", 200, ms, ip);

  return Response.json({ data: rows, meta: { limit: rawLimit, offset, count: rows.length } }, {
    headers: rateLimitHeaders(key),
  });
}
