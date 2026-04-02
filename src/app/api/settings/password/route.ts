import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { compare, hash } from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    currentPassword?: string;
    newPassword?: string;
  };

  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return Response.json({ error: "Current and new passwords are required" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return Response.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }

  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.passwordHash) {
    return Response.json({ error: "No password set — sign in with Google to change password" }, { status: 400 });
  }

  const valid = await compare(currentPassword, user.passwordHash);
  if (!valid) {
    return Response.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const passwordHash = await hash(newPassword, 12);
  await db.update(users).set({ passwordHash }).where(eq(users.id, session.user.id));

  return Response.json({ ok: true });
}
