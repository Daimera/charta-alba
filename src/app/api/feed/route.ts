import { db } from "@/lib/db";
import { cards, papers } from "@/lib/db/schema";
import { desc, gt, sql, eq } from "drizzle-orm";
import type { FeedCardData } from "@/types";

// GET /api/feed?after=<cardId>
// Returns cards created after the given card, or a count if after= provided but count=1
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const afterId = searchParams.get("after");

  if (afterId) {
    // Find the createdAt of the reference card
    const [ref] = await db
      .select({ createdAt: cards.createdAt })
      .from(cards)
      .where(eq(cards.id, afterId))
      .limit(1);

    if (!ref?.createdAt) {
      return Response.json({ cards: [], count: 0 });
    }

    const newCards = await db
      .select({
        id: cards.id,
        paperId: cards.paperId,
        headline: cards.headline,
        hook: cards.hook,
        body: cards.body,
        tldr: cards.tldr,
        tags: cards.tags,
        readingTimeSeconds: cards.readingTimeSeconds,
        likeCount: cards.likeCount,
        videoUrl: cards.videoUrl,
        replicationStatus: cards.replicationStatus,
        eli5Summary: cards.eli5Summary,
        createdAt: cards.createdAt,
        arxivUrl: papers.arxivUrl,
        paperTitle: papers.title,
        abstract: papers.abstract,
        publishedAt: papers.publishedAt,
        commentCount: sql<number>`(SELECT COUNT(*)::int FROM comments WHERE card_id = ${cards.id})`,
        bookmarkCount: sql<number>`(SELECT COUNT(*)::int FROM bookmarks WHERE card_id = ${cards.id})`,
      })
      .from(cards)
      .leftJoin(papers, eq(cards.paperId, papers.id))
      .where(gt(cards.createdAt, ref.createdAt))
      .orderBy(desc(cards.createdAt))
      .limit(20) as unknown as FeedCardData[];

    return Response.json({ cards: newCards, count: newCards.length });
  }

  // No after= → return latest 20 cards
  const latest = await db
    .select({
      id: cards.id,
      paperId: cards.paperId,
      headline: cards.headline,
      hook: cards.hook,
      body: cards.body,
      tldr: cards.tldr,
      tags: cards.tags,
      readingTimeSeconds: cards.readingTimeSeconds,
      likeCount: cards.likeCount,
      videoUrl: cards.videoUrl,
      replicationStatus: cards.replicationStatus,
      eli5Summary: cards.eli5Summary,
      createdAt: cards.createdAt,
      arxivUrl: papers.arxivUrl,
      paperTitle: papers.title,
      abstract: papers.abstract,
      publishedAt: papers.publishedAt,
      commentCount: sql<number>`(SELECT COUNT(*)::int FROM comments WHERE card_id = ${cards.id})`,
      bookmarkCount: sql<number>`(SELECT COUNT(*)::int FROM bookmarks WHERE card_id = ${cards.id})`,
    })
    .from(cards)
    .leftJoin(papers, eq(cards.paperId, papers.id))
    .orderBy(desc(cards.createdAt))
    .limit(20) as unknown as FeedCardData[];

  return Response.json({ cards: latest, count: latest.length });
}
