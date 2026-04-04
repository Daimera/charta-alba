import { db } from "@/lib/db";
import { papers, cards } from "@/lib/db/schema";
import { authenticateApiKey, recordUsage, rateLimitHeaders, TIER_LIMITS } from "@/lib/api-auth";
import { eq, desc, ilike, or, sql, and } from "drizzle-orm";
import { sanitizeString } from "@/lib/sanitize";

export async function GET(req: Request) {
  try {
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
  const category = sanitizeString(searchParams.get("category"), 100);
  const search = sanitizeString(searchParams.get("search"), 500);
  const sort = searchParams.get("sort") ?? "trending";

  const query = db
    .select({
      id: papers.id,
      title: papers.title,
      authors: papers.authors,
      abstract: papers.abstract,
      categories: papers.categories,
      arxivUrl: papers.arxivUrl,
      pdfUrl: papers.pdfUrl,
      publishedAt: papers.publishedAt,
      tldr: cards.tldr,
      tags: cards.tags,
      eli5Summary: cards.eli5Summary,
      replicationStatus: cards.replicationStatus,
      likeCount: cards.likeCount,
      readTime: cards.readingTimeSeconds,
    })
    .from(papers)
    .leftJoin(cards, eq(cards.paperId, papers.id));

  const conditions = [];
  if (category) {
    conditions.push(sql`${papers.categories} @> ARRAY[${category}]::text[]`);
  }
  if (search) {
    conditions.push(or(
      ilike(papers.title, `%${search}%`),
      ilike(papers.abstract, `%${search}%`)
    ));
  }

  let baseQuery = conditions.length > 0
    ? query.where(conditions.length === 1 ? conditions[0] : and(...conditions))
    : query;

  if (sort === "recent") {
    baseQuery = baseQuery.orderBy(desc(papers.publishedAt)) as typeof baseQuery;
  } else if (sort === "top") {
    baseQuery = baseQuery.orderBy(desc(cards.likeCount)) as typeof baseQuery;
  } else {
    // trending: order by like_count (proxy for velocity at this scale)
    baseQuery = baseQuery.orderBy(desc(cards.likeCount)) as typeof baseQuery;
  }

  const rows = await baseQuery.limit(rawLimit).offset(offset);

  // Deduplicate by paper id (multiple cards per paper edge case)
  const seen = new Set<string>();
  const results = rows.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  const ms = Date.now() - start;
  recordUsage(key.id, "/api/v1/papers", 200, ms, ip);

  return Response.json({ data: results, meta: { limit: rawLimit, offset, count: results.length } }, {
    headers: rateLimitHeaders(key),
  });
  } catch (err) {
    console.error("[api/v1/papers]", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
