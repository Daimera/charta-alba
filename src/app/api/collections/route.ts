import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { collections } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(collections)
    .where(eq(collections.userId, session.user.id))
    .orderBy(desc(collections.createdAt));

  return NextResponse.json({ collections: rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let name: string, description: string | undefined, isPublic: boolean;
  try {
    ({ name, description, isPublic = false } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const [collection] = await db
    .insert(collections)
    .values({
      userId: session.user.id,
      name: name.trim(),
      description: description?.trim() || null,
      isPublic,
    })
    .returning();

  return NextResponse.json({ collection }, { status: 201 });
}
