import { db } from "@/lib/db";
import { profiles, likes, cards, papers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  // Resolve username → userId
  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);

  if (!profile) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await db
    .select({
      id: cards.id,
      headline: cards.headline,
      hook: cards.hook,
      tags: cards.tags,
      readingTimeSeconds: cards.readingTimeSeconds,
      arxivUrl: papers.arxivUrl,
    })
    .from(likes)
    .innerJoin(cards, eq(likes.cardId, cards.id))
    .leftJoin(papers, eq(cards.paperId, papers.id))
    .where(eq(likes.userId, profile.id))
    .orderBy(desc(likes.createdAt))
    .limit(50);

  return Response.json({ cards: rows });
}
