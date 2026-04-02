import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { claims, cards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getClaims } from "@/lib/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // `id` in the URL is the cardId; we need the paperId
  const { id: cardId } = await params;

  const [card] = await db
    .select({ paperId: cards.paperId })
    .from(cards)
    .where(eq(cards.id, cardId));

  if (!card) {
    return Response.json({ claims: [] });
  }

  const result = await getClaims(card.paperId);
  return Response.json({ claims: result });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id: cardId } = await params;

  const body = await req.json();
  const email: string = body.email ?? "";
  const orcidId: string | null = body.orcidId ?? null;

  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Valid email required" }, { status: 400 });
  }

  const [card] = await db
    .select({ paperId: cards.paperId })
    .from(cards)
    .where(eq(cards.id, cardId));

  if (!card) {
    return Response.json({ error: "Card not found" }, { status: 404 });
  }

  const [inserted] = await db
    .insert(claims)
    .values({
      paperId: card.paperId,
      userId: session?.user?.id ?? null,
      email: email.trim(),
      orcidId: orcidId?.trim() || null,
      status: "pending",
    })
    .returning();

  return Response.json({ claim: inserted }, { status: 201 });
}
