import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(_req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({
      totpEnabled: users.totpEnabled,
      totpEnabledAt: users.totpEnabledAt,
      backupCodesCount: sql<number>`COALESCE(array_length(totp_backup_codes, 1), 0)::int`,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return Response.json({
    enabled: user?.totpEnabled ?? false,
    enabledAt: user?.totpEnabledAt ?? null,
    backupCodesRemaining: user?.backupCodesCount ?? 0,
  });
}
