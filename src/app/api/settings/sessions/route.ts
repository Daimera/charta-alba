import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { loginSessions, accounts } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [sessions, googleAccount] = await Promise.all([
    db
      .select({
        id: loginSessions.id,
        ipAddress: loginSessions.ipAddress,
        userAgent: loginSessions.userAgent,
        createdAt: loginSessions.createdAt,
      })
      .from(loginSessions)
      .where(eq(loginSessions.userId, session.user.id))
      .orderBy(desc(loginSessions.createdAt))
      .limit(5),
    db
      .select({ provider: accounts.provider })
      .from(accounts)
      .where(eq(accounts.userId, session.user.id))
      .limit(10),
  ]);

  const connectedProviders = googleAccount.map((a) => a.provider);

  return Response.json({ sessions, connectedProviders });
}

// DELETE signs the caller out of their current session (JWT is client-side,
// so full cross-device revocation requires a denylist — this is a placeholder).
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({ ok: true });
}
