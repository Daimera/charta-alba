import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { circlePosts, circleMembers, users } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const posts = await db
    .select({
      id: circlePosts.id,
      type: circlePosts.type,
      content: circlePosts.content,
      createdAt: circlePosts.createdAt,
      userId: circlePosts.userId,
      authorName: users.name,
      authorImage: users.image,
    })
    .from(circlePosts)
    .leftJoin(users, eq(circlePosts.userId, users.id))
    .where(eq(circlePosts.circleId, id))
    .orderBy(desc(circlePosts.createdAt))
    .limit(50);

  return Response.json({ posts });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Must be a member to post
  const [membership] = await db
    .select({ role: circleMembers.role })
    .from(circleMembers)
    .where(and(eq(circleMembers.circleId, id), eq(circleMembers.userId, session.user.id)))
    .limit(1);

  if (!membership) {
    return Response.json({ error: "You must be a member to post in this Circle" }, { status: 403 });
  }

  const body = await req.json() as {
    content?: string;
    type?: string;
  };

  const content = body.content?.trim();
  if (!content) {
    return Response.json({ error: "Post content is required" }, { status: 400 });
  }
  if (content.length > 2000) {
    return Response.json({ error: "Post must be 2000 characters or fewer" }, { status: 400 });
  }

  const [post] = await db
    .insert(circlePosts)
    .values({
      circleId: id,
      userId: session.user.id,
      type: body.type ?? "discussion",
      content,
    })
    .returning();

  return Response.json({ post }, { status: 201 });
}
