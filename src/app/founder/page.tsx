import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import FounderDashboard from "@/components/founder/Dashboard";

const TOTP_FRESH_MS = 15 * 60_000;

export default async function FounderPage() {
  const session = await auth();

  // Not logged in → sign in
  if (!session?.user?.id) redirect("/auth/signin");

  // Not the founder → 404 (do not reveal this route exists)
  if (!session.user.isFounder) notFound();

  // Verify TOTP freshness from DB (never trust session alone)
  const [founder] = await db
    .select({ founderLastVerified: users.founderLastVerified })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const lastVerified = founder?.founderLastVerified;
  const isFresh =
    !!lastVerified &&
    Date.now() - new Date(lastVerified).getTime() < TOTP_FRESH_MS;

  if (!isFresh) redirect("/founder/verify");

  return <FounderDashboard />;
}
