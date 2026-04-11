import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookmarks, cards, papers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SavedList } from "./SavedList";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/saved");
  }

  const rows = await db
    .select({
      cardId: cards.id,
      headline: cards.headline,
      hook: cards.hook,
      tags: cards.tags,
      readingTimeSeconds: cards.readingTimeSeconds,
      arxivUrl: papers.arxivUrl,
      savedAt: bookmarks.createdAt,
    })
    .from(bookmarks)
    .innerJoin(cards, eq(bookmarks.cardId, cards.id))
    .leftJoin(papers, eq(cards.paperId, papers.id))
    .where(eq(bookmarks.userId, session.user.id))
    .orderBy(desc(bookmarks.createdAt))
    .limit(100);

  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold tracking-tight">Saved</h1>
          <p className="text-white/40 text-sm mt-1">{rows.length} bookmarked paper{rows.length !== 1 ? "s" : ""}</p>
        </div>
        <SavedList initialRows={rows} />
      </div>
    </main>
  );
}
