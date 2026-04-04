import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { videoLikes, videos } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { assertUUID } from "@/lib/sanitize";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: videoId } = await params;
  const uuidErr = assertUUID(videoId);
  if (uuidErr) return uuidErr;
  const userId = session.user.id;

  const [inserted] = await db
    .insert(videoLikes)
    .values({ userId, videoId })
    .onConflictDoNothing()
    .returning({ id: videoLikes.id });

  if (inserted) {
    await db
      .update(videos)
      .set({ likeCount: sql`${videos.likeCount} + 1` })
      .where(eq(videos.id, videoId));
  }

  const [video] = await db
    .select({ likeCount: videos.likeCount })
    .from(videos)
    .where(eq(videos.id, videoId));

  return Response.json({ liked: true, likeCount: video?.likeCount ?? 0 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: videoId } = await params;
  const uuidErr2 = assertUUID(videoId);
  if (uuidErr2) return uuidErr2;
  const userId = session.user.id;

  const deleted = await db
    .delete(videoLikes)
    .where(and(eq(videoLikes.userId, userId), eq(videoLikes.videoId, videoId)))
    .returning({ id: videoLikes.id });

  if (deleted.length > 0) {
    await db
      .update(videos)
      .set({ likeCount: sql`GREATEST(${videos.likeCount} - 1, 0)` })
      .where(eq(videos.id, videoId));
  }

  const [video] = await db
    .select({ likeCount: videos.likeCount })
    .from(videos)
    .where(eq(videos.id, videoId));

  return Response.json({ liked: false, likeCount: video?.likeCount ?? 0 });
}
