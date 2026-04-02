import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { password?: string };
  if (!body.password) {
    return Response.json({ error: "Password is required" }, { status: 400 });
  }

  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.passwordHash) {
    return Response.json(
      { error: "No password set — use Google to manage your account" },
      { status: 400 }
    );
  }

  const valid = await compare(body.password, user.passwordHash);
  if (!valid) {
    return Response.json({ error: "Password is incorrect" }, { status: 400 });
  }

  await db
    .insert(profiles)
    .values({ id: session.user.id, isActive: false })
    .onConflictDoUpdate({ target: profiles.id, set: { isActive: false } });

  return Response.json({ ok: true });
}
