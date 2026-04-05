/**
 * GET /api/creator/stats
 * Overview stats for the logged-in creator.
 * ?days=30 (default 30, max 365)
 */

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions, cards, likes, bookmarks, contentViews, userFollows, pointsLedger } from "@/lib/db/schema";
import { eq, and, gte, sql, count } from "drizzle-orm";

function clampDays(raw: string | null): number {
  const n = parseInt(raw ?? "30", 10);
  if (isNaN(n) || n < 1) return 30;
  if (n > 365) return 365;
  return n;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = clampDays(searchParams.get("days"));
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const userId = session.user.id;

  // Published card IDs from this user's submissions
  const publishedSubs = await db
    .select({ cardId: submissions.publishedCardId })
    .from(submissions)
    .where(and(eq(submissions.userId, userId), eq(submissions.status, "published")));

  const cardIds = publishedSubs
    .map((s) => s.cardId)
    .filter((id): id is string => id !== null);

  // If no published cards, return zeroed stats
  if (cardIds.length === 0) {
    const [followerData] = await db
      .select({ count: count() })
      .from(userFollows)
      .where(eq(userFollows.followingId, userId));

    const [pointData] = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)::int` })
      .from(pointsLedger)
      .where(and(eq(pointsLedger.userId, userId), gte(pointsLedger.createdAt, since)));

    return Response.json({
      period: days,
      totalCards: 0,
      totalViews: 0,
      totalLikes: 0,
      totalBookmarks: 0,
      totalComments: 0,
      followerCount: followerData?.count ?? 0,
      newFollowers: 0,
      pointsEarned: pointData?.total ?? 0,
      viewsOverTime: [],
      likesOverTime: [],
    });
  }

  // Aggregate metrics across all published cards
  const [viewData] = await db
    .select({ total: count() })
    .from(contentViews)
    .where(
      and(
        eq(contentViews.contentType, "card"),
        sql`${contentViews.contentId} = ANY(${sql.raw(`ARRAY[${cardIds.map((id) => `'${id}'`).join(",")}]`)})`,
        gte(contentViews.viewedAt, since),
      )
    );

  const [likeData] = await db
    .select({ total: count() })
    .from(likes)
    .where(
      and(
        sql`${likes.cardId} = ANY(${sql.raw(`ARRAY[${cardIds.map((id) => `'${id}'::uuid`).join(",")}]`)})`,
        gte(likes.createdAt, since),
      )
    );

  const [bookmarkData] = await db
    .select({ total: count() })
    .from(bookmarks)
    .where(
      and(
        sql`${bookmarks.cardId} = ANY(${sql.raw(`ARRAY[${cardIds.map((id) => `'${id}'::uuid`).join(",")}]`)})`,
        gte(bookmarks.createdAt, since),
      )
    );

  const [followerData] = await db
    .select({ count: count() })
    .from(userFollows)
    .where(eq(userFollows.followingId, userId));

  const [newFollowerData] = await db
    .select({ count: count() })
    .from(userFollows)
    .where(and(eq(userFollows.followingId, userId), gte(userFollows.createdAt, since)));

  const [pointData] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)::int` })
    .from(pointsLedger)
    .where(and(eq(pointsLedger.userId, userId), gte(pointsLedger.createdAt, since)));

  // Daily views over time (last N days, capped at 30 buckets for display)
  const bucketDays = Math.min(days, 30);
  const viewsOverTime = await db.execute(sql`
    SELECT
      DATE_TRUNC('day', viewed_at) AS day,
      COUNT(*)::int AS views
    FROM content_views
    WHERE content_type = 'card'
      AND content_id = ANY(ARRAY[${sql.raw(cardIds.map((id) => `'${id}'`).join(","))}])
      AND viewed_at >= NOW() - INTERVAL '${sql.raw(String(bucketDays))} days'
    GROUP BY 1
    ORDER BY 1
  `);

  const viewsRows = (viewsOverTime as unknown as Array<{ day: string; views: number }>).map((r) => ({
    day: String(r.day).slice(0, 10),
    views: Number(r.views),
  }));

  return Response.json({
    period: days,
    totalCards: cardIds.length,
    totalViews: viewData?.total ?? 0,
    totalLikes: likeData?.total ?? 0,
    totalBookmarks: bookmarkData?.total ?? 0,
    followerCount: followerData?.count ?? 0,
    newFollowers: newFollowerData?.count ?? 0,
    pointsEarned: pointData?.total ?? 0,
    viewsOverTime: viewsRows,
  });
}
