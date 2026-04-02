import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comments, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getComments } from "@/lib/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cardId } = await params;
  const result = await getComments(cardId);
  return Response.json({ comments: result });
}

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
  const bodyText: string = body.body ?? "";
  const parentId: string | null = body.parentId ?? null;

  if (!bodyText.trim() || bodyText.length > 1000) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const [inserted] = await db
    .insert(comments)
    .values({ cardId, userId, body: bodyText.trim(), parentId })
    .returning();

  // Fetch author info
  const [user] = await db
    .select({ name: users.name, image: users.image })
    .from(users)
    .where(eq(users.id, userId));

  return Response.json({
    comment: {
      ...inserted,
      authorName: user?.name ?? null,
      authorImage: user?.image ?? null,
      replies: [],
    },
  });
}
