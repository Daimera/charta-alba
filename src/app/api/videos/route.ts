import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { videos, users, papers } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { isAllowedVideoUrl } from "@/lib/validateUrl";

export async function GET() {
  const rows = await db
    .select({
      id: videos.id,
      title: videos.title,
      description: videos.description,
      videoUrl: videos.videoUrl,
      userId: videos.userId,
      paperId: videos.paperId,
      likeCount: videos.likeCount,
      createdAt: videos.createdAt,
      authorName: users.name,
      authorImage: users.image,
      paperTitle: papers.title,
    })
    .from(videos)
    .leftJoin(users, eq(videos.userId, users.id))
    .leftJoin(papers, eq(videos.paperId, papers.id))
    .orderBy(desc(videos.createdAt))
    .limit(50);

  return Response.json({ videos: rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    title?: string;
    description?: string;
    videoUrl?: string;
    paperId?: string;
  };

  const { title, description, videoUrl, paperId } = body;

  if (!title?.trim() || !description?.trim() || !videoUrl?.trim()) {
    return Response.json({ error: "title, description, and videoUrl are required" }, { status: 400 });
  }

  // Validate video URL — only YouTube and Vimeo, no internal hosts
  if (!isAllowedVideoUrl(videoUrl)) {
    return Response.json({ error: "Video URL must be a YouTube or Vimeo link" }, { status: 400 });
  }

  const [video] = await db
    .insert(videos)
    .values({
      title: title.trim(),
      description: description.trim(),
      videoUrl: videoUrl.trim(),
      userId: session.user.id,
      paperId: paperId?.trim() || null,
    })
    .returning();

  await db.execute(sql`SELECT 1`); // flush

  return Response.json({ video }, { status: 201 });
}
