import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function ProfileMePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/profile/me");
  }

  const [profile] = await db
    .select({ username: profiles.username })
    .from(profiles)
    .where(eq(profiles.id, session.user.id))
    .limit(1);

  if (profile?.username) {
    redirect(`/profile/${profile.username}`);
  }

  // No username set — redirect to profile settings
  redirect("/settings/profile");
}
