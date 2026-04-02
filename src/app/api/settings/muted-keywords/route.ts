import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { mutedKeywords } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({ id: mutedKeywords.id, keyword: mutedKeywords.keyword, createdAt: mutedKeywords.createdAt })
    .from(mutedKeywords)
    .where(eq(mutedKeywords.userId, session.user.id))
    .orderBy(mutedKeywords.createdAt);

  return Response.json({ keywords: rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { keyword?: string };
  const keyword = body.keyword?.trim().toLowerCase();

  if (!keyword) {
    return Response.json({ error: "Keyword is required" }, { status: 400 });
  }
  if (keyword.length > 100) {
    return Response.json({ error: "Keyword must be 100 characters or fewer" }, { status: 400 });
  }

  const [row] = await db
    .insert(mutedKeywords)
    .values({ userId: session.user.id, keyword })
    .onConflictDoNothing()
    .returning();

  // onConflictDoNothing returns empty if duplicate — fetch the existing row
  if (!row) {
    const [existing] = await db
      .select()
      .from(mutedKeywords)
      .where(and(eq(mutedKeywords.userId, session.user.id), eq(mutedKeywords.keyword, keyword)))
      .limit(1);
    return Response.json({ keyword: existing });
  }

  return Response.json({ keyword: row }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { keyword?: string };
  const keyword = body.keyword?.trim().toLowerCase();

  if (!keyword) {
    return Response.json({ error: "Keyword is required" }, { status: 400 });
  }

  await db
    .delete(mutedKeywords)
    .where(and(eq(mutedKeywords.userId, session.user.id), eq(mutedKeywords.keyword, keyword)));

  return Response.json({ ok: true });
}
