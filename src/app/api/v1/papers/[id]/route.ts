import { db } from "@/lib/db";
import { papers, cards, citations } from "@/lib/db/schema";
import { authenticateApiKey, recordUsage, rateLimitHeaders } from "@/lib/api-auth";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { id } = await params;

  const [paper] = await db
    .select()
    .from(papers)
    .where(eq(papers.id, id))
    .limit(1);

  if (!paper) {
    recordUsage(key.id, `/api/v1/papers/${id}`, 404, Date.now() - start, ip);
    return Response.json({ error: "Paper not found" }, { status: 404, headers: rateLimitHeaders(key) });
  }

  const [card] = await db
    .select()
    .from(cards)
    .where(eq(cards.paperId, id))
    .limit(1);

  // Citation graph (cited papers)
  const citationRows = card
    ? await db
        .select({ citedCardId: citations.citedCardId })
        .from(citations)
        .where(eq(citations.citingCardId, card.id))
        .limit(20)
    : [];

  const relatedPaperIds = citationRows.map((r) => r.citedCardId);

  const ms = Date.now() - start;
  recordUsage(key.id, `/api/v1/papers/${id}`, 200, ms, ip);

  return Response.json({
    data: {
      ...paper,
      tldr: card?.tldr ?? null,
      tags: card?.tags ?? [],
      eli5Summary: card?.eli5Summary ?? null,
      replicationStatus: card?.replicationStatus ?? null,
      likeCount: card?.likeCount ?? 0,
      readTime: card?.readingTimeSeconds ?? null,
      citedCardIds: relatedPaperIds,
    },
  }, { headers: rateLimitHeaders(key) });
}
