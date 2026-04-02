import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    emailDigest?: boolean;
    emailComments?: boolean;
    emailNewFollower?: boolean;
    emailReply?: boolean;
    emailBreakthrough?: boolean;
  };

  const set: Record<string, unknown> = {};
  if (body.emailDigest !== undefined) set.emailDigest = body.emailDigest;
  if (body.emailComments !== undefined) set.emailComments = body.emailComments;
  if (body.emailNewFollower !== undefined) set.emailNewFollower = body.emailNewFollower;
  if (body.emailReply !== undefined) set.emailReply = body.emailReply;
  if (body.emailBreakthrough !== undefined) set.emailBreakthrough = body.emailBreakthrough;

  if (Object.keys(set).length === 0) return Response.json({ ok: true });

  await db
    .insert(profiles)
    .values({ id: session.user.id, ...set })
    .onConflictDoUpdate({ target: profiles.id, set });

  return Response.json({ ok: true });
}
