/**
 * GET /api/creator/posts
 * Per-post analytics for the logged-in creator's published cards.
 * ?sort=views|likes|bookmarks|date  ?order=desc|asc  ?page=1
 */

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions, cards, bookmarks, contentViews } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

type SortField = "views" | "likes" | "bookmarks" | "date";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sortRaw = searchParams.get("sort") ?? "date";
  const sort: SortField = (["views", "likes", "bookmarks", "date"] as const).includes(sortRaw as SortField)
    ? (sortRaw as SortField)
    : "date";
  const orderRaw = searchParams.get("order") ?? "desc";
  const orderDir = orderRaw === "asc" ? "asc" : "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  // Get published submissions for this user
  const publishedSubs = await db
    .select({
      submissionId: submissions.id,
      cardId: submissions.publishedCardId,
      submittedAt: submissions.createdAt,
      submissionType: submissions.submissionType,
    })
    .from(submissions)
    .where(and(eq(submissions.userId, session.user.id), eq(submissions.status, "published")));

  const cardIds = publishedSubs
    .map((s) => s.cardId)
    .filter((id): id is string => id !== null);

  if (cardIds.length === 0) {
    return Response.json({ posts: [], total: 0, hasMore: false });
  }

  // Fetch cards with denormalized counts
  const cardRows = await db
    .select({
      id: cards.id,
      headline: cards.headline,
      hook: cards.hook,
      tldr: cards.tldr,
      tags: cards.tags,
      likeCount: cards.likeCount,
      createdAt: cards.createdAt,
      paperId: cards.paperId,
    })
    .from(cards)
    .where(sql`${cards.id} = ANY(${sql.raw(`ARRAY[${cardIds.map((id) => `'${id}'::uuid`).join(",")}]`)})`);

  // Count views per card
  const viewCounts = await db
    .select({
      contentId: contentViews.contentId,
      views: sql<number>`COUNT(*)::int`,
    })
    .from(contentViews)
    .where(
      and(
        eq(contentViews.contentType, "card"),
        sql`${contentViews.contentId} = ANY(${sql.raw(`ARRAY[${cardIds.map((id) => `'${id}'`).join(",")}]`)})`,
      )
    )
    .groupBy(contentViews.contentId);

  // Count bookmarks per card
  const bookmarkCounts = await db
    .select({
      cardId: bookmarks.cardId,
      bmarks: sql<number>`COUNT(*)::int`,
    })
    .from(bookmarks)
    .where(
      sql`${bookmarks.cardId} = ANY(${sql.raw(`ARRAY[${cardIds.map((id) => `'${id}'::uuid`).join(",")}]`)})`
    )
    .groupBy(bookmarks.cardId);

  const viewMap = Object.fromEntries(viewCounts.map((r) => [r.contentId, r.views]));
  const bmarkMap = Object.fromEntries(bookmarkCounts.map((r) => [r.cardId, r.bmarks]));
  const subMap = Object.fromEntries(publishedSubs.map((s) => [s.cardId, s]));

  const posts = cardRows.map((c) => ({
    id: c.id,
    headline: c.headline,
    hook: c.hook,
    tldr: c.tldr,
    tags: c.tags,
    views: viewMap[c.id] ?? 0,
    likes: c.likeCount,
    bookmarks: bmarkMap[c.id] ?? 0,
    publishedAt: c.createdAt,
    submissionType: subMap[c.id]?.submissionType ?? "paper",
    paperId: c.paperId,
  }));

  // Sort
  posts.sort((a, b) => {
    let diff = 0;
    if (sort === "views")     diff = a.views - b.views;
    else if (sort === "likes")     diff = a.likes - b.likes;
    else if (sort === "bookmarks") diff = a.bookmarks - b.bookmarks;
    else diff = new Date(a.publishedAt ?? 0).getTime() - new Date(b.publishedAt ?? 0).getTime();
    return orderDir === "desc" ? -diff : diff;
  });

  const paged = posts.slice(offset, offset + limit);

  return Response.json({
    posts: paged,
    total: posts.length,
    hasMore: offset + limit < posts.length,
  });
}
