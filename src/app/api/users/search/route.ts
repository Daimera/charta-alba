import { db } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";
import { eq, ilike, and, isNotNull } from "drizzle-orm";

/** GET /api/users/search?q=username — find users by username prefix */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().replace(/^@/, "");
  if (!q || q.length < 2) {
    return Response.json({ users: [] });
  }

  const rows = await db
    .select({
      userId: profiles.id,
      username: profiles.username,
      name: users.name,
      image: users.image,
    })
    .from(profiles)
    .leftJoin(users, eq(profiles.id, users.id))
    .where(and(isNotNull(profiles.username), ilike(profiles.username, `${q}%`)))
    .limit(8);

  return Response.json({ users: rows });
}
