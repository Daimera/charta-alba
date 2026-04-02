import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { collections, collectionItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function assertOwner(collectionId: string, userId: string) {
  const [col] = await db
    .select({ userId: collections.userId })
    .from(collections)
    .where(eq(collections.id, collectionId))
    .limit(1);
  if (!col) return "not_found";
  if (col.userId !== userId) return "forbidden";
  return "ok";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const check = await assertOwner(id, session.user.id);
  if (check === "not_found") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (check === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let cardId: string;
  try {
    ({ cardId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await db
    .insert(collectionItems)
    .values({ collectionId: id, cardId })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const check = await assertOwner(id, session.user.id);
  if (check === "not_found") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (check === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let cardId: string;
  try {
    ({ cardId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await db
    .delete(collectionItems)
    .where(and(eq(collectionItems.collectionId, id), eq(collectionItems.cardId, cardId)));

  return NextResponse.json({ ok: true });
}
