import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collections, collectionItems, cards, papers } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, id))
    .limit(1);

  if (!collection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!collection.isPublic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const items = await db
    .select({
      addedAt: collectionItems.addedAt,
      id: cards.id,
      paperId: cards.paperId,
      headline: cards.headline,
      hook: cards.hook,
      tldr: cards.tldr,
      tags: cards.tags,
      likeCount: cards.likeCount,
      replicationStatus: cards.replicationStatus,
      arxivUrl: papers.arxivUrl,
      paperTitle: papers.title,
    })
    .from(collectionItems)
    .innerJoin(cards, eq(collectionItems.cardId, cards.id))
    .leftJoin(papers, eq(cards.paperId, papers.id))
    .where(eq(collectionItems.collectionId, id))
    .orderBy(desc(collectionItems.addedAt));

  return NextResponse.json({ collection, items });
}
