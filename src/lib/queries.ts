import { desc, eq, gte, and, isNull, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { cards, papers, likes, bookmarks, comments, claims, users, citations, profiles } from "@/lib/db/schema";
import type { FeedCardData, CitationLink, TrendingTag } from "@/types";

const feedSelect = {
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
};

export function loadFeed(): Promise<FeedCardData[]> {
  return db
    .select(feedSelect)
    .from(cards)
    .leftJoin(papers, eq(cards.paperId, papers.id))
    .orderBy(desc(cards.createdAt))
    .limit(20) as Promise<FeedCardData[]>;
}

export function loadTop(window: "today" | "week" | "month" | "all"): Promise<FeedCardData[]> {
  const cutoffMs: Record<string, number> = {
    today: 86_400_000,
    week: 604_800_000,
    month: 2_592_000_000,
  };

  if (window === "all") {
    return db
      .select(feedSelect)
      .from(cards)
      .leftJoin(papers, eq(cards.paperId, papers.id))
      .orderBy(desc(cards.likeCount), desc(cards.createdAt))
      .limit(50) as Promise<FeedCardData[]>;
  }

  const cutoff = new Date(Date.now() - cutoffMs[window]).toISOString();
  return db
    .select(feedSelect)
    .from(cards)
    .leftJoin(papers, eq(cards.paperId, papers.id))
    .where(gte(cards.createdAt, cutoff))
    .orderBy(desc(cards.likeCount), desc(cards.createdAt))
    .limit(50) as Promise<FeedCardData[]>;
}

export async function getCardWithPaper(cardId: string) {
  const [result] = await db
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
      createdAt: cards.createdAt,
      arxivUrl: papers.arxivUrl,
      paperTitle: papers.title,
      abstract: papers.abstract,
    })
    .from(cards)
    .leftJoin(papers, eq(cards.paperId, papers.id))
    .where(eq(cards.id, cardId));
  return result ?? null;
}

export async function loadUserLikes(userId: string): Promise<string[]> {
  const rows = await db
    .select({ cardId: likes.cardId })
    .from(likes)
    .where(eq(likes.userId, userId));
  return rows.map((r) => r.cardId);
}

export async function loadUserBookmarks(userId: string): Promise<string[]> {
  const rows = await db
    .select({ cardId: bookmarks.cardId })
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId));
  return rows.map((r) => r.cardId);
}

export async function getComments(cardId: string) {
  const topLevel = await db
    .select({
      id: comments.id,
      cardId: comments.cardId,
      userId: comments.userId,
      parentId: comments.parentId,
      body: comments.body,
      createdAt: comments.createdAt,
      authorName: users.name,
      authorImage: users.image,
      authorTier: profiles.subscriptionTier,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .leftJoin(profiles, eq(comments.userId, profiles.id))
    .where(and(eq(comments.cardId, cardId), isNull(comments.parentId)))
    .orderBy(desc(comments.createdAt))
    .limit(30);

  if (topLevel.length === 0) return [];

  const topLevelIds = topLevel.map((c) => c.id);
  const replies = await db
    .select({
      id: comments.id,
      cardId: comments.cardId,
      userId: comments.userId,
      parentId: comments.parentId,
      body: comments.body,
      createdAt: comments.createdAt,
      authorName: users.name,
      authorImage: users.image,
      authorTier: profiles.subscriptionTier,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .leftJoin(profiles, eq(comments.userId, profiles.id))
    .where(inArray(comments.parentId, topLevelIds))
    .orderBy(desc(comments.createdAt));

  const repliesByParent = replies.reduce<Record<string, typeof replies>>(
    (acc, r) => {
      const key = r.parentId!;
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    },
    {}
  );

  return topLevel.map((c) => ({
    ...c,
    replies: repliesByParent[c.id] ?? [],
  }));
}

export async function getClaims(paperId: string) {
  return db
    .select({
      id: claims.id,
      paperId: claims.paperId,
      email: claims.email,
      orcidId: claims.orcidId,
      status: claims.status,
      createdAt: claims.createdAt,
    })
    .from(claims)
    .where(eq(claims.paperId, paperId))
    .orderBy(desc(claims.createdAt))
    .limit(20);
}

// Load citation mini-cards for a batch of card IDs.
// Returns a map: cardId → related CitationLinks (bidirectional).
export async function loadCardCitations(
  cardIds: string[]
): Promise<Record<string, CitationLink[]>> {
  if (cardIds.length === 0) return {};

  const [citing, cited] = await Promise.all([
    // Cards that our cards cite (citing_card_id ∈ cardIds → fetch cited card)
    db
      .select({
        sourceId: citations.citingCardId,
        cardId: citations.citedCardId,
        headline: cards.headline,
        tags: cards.tags,
      })
      .from(citations)
      .innerJoin(cards, eq(citations.citedCardId, cards.id))
      .where(inArray(citations.citingCardId, cardIds)),

    // Cards that cite our cards (cited_card_id ∈ cardIds → fetch citing card)
    db
      .select({
        sourceId: citations.citedCardId,
        cardId: citations.citingCardId,
        headline: cards.headline,
        tags: cards.tags,
      })
      .from(citations)
      .innerJoin(cards, eq(citations.citingCardId, cards.id))
      .where(inArray(citations.citedCardId, cardIds)),
  ]);

  const result: Record<string, CitationLink[]> = {};
  for (const row of [...citing, ...cited]) {
    if (!result[row.sourceId]) result[row.sourceId] = [];
    if (!result[row.sourceId].some((c) => c.cardId === row.cardId)) {
      result[row.sourceId].push({
        cardId: row.cardId,
        headline: row.headline,
        tags: row.tags ?? [],
      });
    }
  }
  return result;
}

// Top trending tags by like velocity over the last 7 days.
export async function loadTrendingTags(limit = 5): Promise<TrendingTag[]> {
  const rows = await db.execute(sql`
    SELECT unnest(c.tags) AS tag, COUNT(l.id)::int AS cnt
    FROM likes l
    JOIN cards c ON l.card_id = c.id
    WHERE l.created_at > NOW() - INTERVAL '7 days'
    GROUP BY tag
    ORDER BY cnt DESC
    LIMIT ${limit}
  `);
  return (rows.rows as { tag: string; cnt: number }[]).map((r) => ({
    tag: r.tag,
    count: r.cnt,
  }));
}
