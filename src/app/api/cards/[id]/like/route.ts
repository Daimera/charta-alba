import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { likes, cards } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: cardId } = await params;
  const userId = session.user.id;

  const [inserted] = await db
    .insert(likes)
    .values({ userId, cardId })
    .onConflictDoNothing()
    .returning({ id: likes.id });

  if (inserted) {
    await db
      .update(cards)
      .set({ likeCount: sql`${cards.likeCount} + 1` })
      .where(eq(cards.id, cardId));
  }

  const [card] = await db
    .select({ likeCount: cards.likeCount })
    .from(cards)
    .where(eq(cards.id, cardId));

  return Response.json({ liked: true, likeCount: card?.likeCount ?? 0 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: cardId } = await params;
  const userId = session.user.id;

  const deleted = await db
    .delete(likes)
    .where(and(eq(likes.userId, userId), eq(likes.cardId, cardId)))
    .returning({ id: likes.id });

  if (deleted.length > 0) {
    await db
      .update(cards)
      .set({ likeCount: sql`GREATEST(${cards.likeCount} - 1, 0)` })
      .where(eq(cards.id, cardId));
  }

  const [card] = await db
    .select({ likeCount: cards.likeCount })
    .from(cards)
    .where(eq(cards.id, cardId));

  return Response.json({ liked: false, likeCount: card?.likeCount ?? 0 });
}
