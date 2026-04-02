import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cardRatings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: cardId } = await params;
  const userId = session.user.id;

  const body = await req.json();
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json({ error: "Rating must be 1–5" }, { status: 400 });
  }

  // Upsert: update if exists, insert if not
  const [existing] = await db
    .select({ id: cardRatings.id })
    .from(cardRatings)
    .where(and(eq(cardRatings.userId, userId), eq(cardRatings.cardId, cardId)));

  if (existing) {
    await db
      .update(cardRatings)
      .set({ rating })
      .where(and(eq(cardRatings.userId, userId), eq(cardRatings.cardId, cardId)));
  } else {
    await db.insert(cardRatings).values({ userId, cardId, rating });
  }

  return Response.json({ rating });
}
