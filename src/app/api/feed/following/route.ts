import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userFollows, likes as likesTable, cards, papers } from "@/lib/db/schema";
import { eq, sql, desc, inArray } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 50);
  const offset = Number(url.searchParams.get("offset") ?? "0");

  // Get IDs of users the viewer follows
  const followingRows = await db
    .select({ followingId: userFollows.followingId })
    .from(userFollows)
    .where(eq(userFollows.followerId, session.user.id));

  if (followingRows.length === 0) {
    return Response.json({ cards: [], total: 0, empty: "not_following" });
  }

  const followingIds = followingRows.map((r) => r.followingId);

  // Cards liked by followed users (recent activity)
  const likedCardIds = await db
    .select({ cardId: likesTable.cardId })
    .from(likesTable)
    .where(inArray(likesTable.userId, followingIds))
    .orderBy(desc(likesTable.createdAt))
    .limit(200); // larger pool to deduplicate

  const uniqueCardIds = [...new Set(likedCardIds.map((r) => r.cardId))];

  if (uniqueCardIds.length === 0) {
    return Response.json({ cards: [], total: 0, empty: "no_activity" });
  }

  const paginatedIds = uniqueCardIds.slice(offset, offset + limit);

  const feedCards = await db
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
      paperTitle: papers.title,
      paperAuthors: papers.authors,
      paperCategories: papers.categories,
      paperPublishedAt: papers.publishedAt,
      paperArxivUrl: papers.arxivUrl,
    })
    .from(cards)
    .innerJoin(papers, eq(papers.id, cards.paperId))
    .where(sql`${cards.id} = ANY(${sql.raw(`ARRAY[${paginatedIds.map((id) => `'${id}'::uuid`).join(",")}]`)})`)
    .limit(limit);

  return Response.json({
    cards: feedCards,
    total: uniqueCardIds.length,
    hasMore: offset + limit < uniqueCardIds.length,
  });
}
