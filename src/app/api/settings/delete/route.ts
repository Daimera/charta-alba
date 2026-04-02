import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { password?: string };
  const { password } = body;

  if (!password) {
    return Response.json({ error: "Password is required to delete your account" }, { status: 400 });
  }

  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.passwordHash) {
    return Response.json({ error: "Cannot verify identity — contact support" }, { status: 400 });
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    return Response.json({ error: "Incorrect password" }, { status: 400 });
  }

  await db.delete(users).where(eq(users.id, session.user.id));

  return Response.json({ ok: true });
}
