import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookmarks, cards, papers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return m <= 1 ? "just now" : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

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
      tldr: cards.tldr,
      tags: cards.tags,
      readingTimeSeconds: cards.readingTimeSeconds,
      arxivUrl: papers.arxivUrl,
      paperTitle: papers.title,
      publishedAt: papers.publishedAt,
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

        {rows.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/25">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-white/30 text-sm">Nothing saved yet.</p>
            <Link href="/" className="inline-block px-4 py-2 rounded-lg bg-white/8 border border-white/10 text-sm text-white/60 hover:bg-white/12 transition-colors">
              Browse the feed
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.cardId} className="p-4 rounded-2xl bg-white/4 border border-white/8 hover:bg-white/6 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm leading-snug mb-1 line-clamp-2">{row.headline}</p>
                    <p className="text-white/50 text-xs leading-relaxed line-clamp-2 mb-2">{row.hook}</p>
                    {row.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {row.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="text-xs text-white/35 bg-white/5 px-2 py-0.5 rounded-full">#{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-white/25 text-xs">
                      <span>{row.readingTimeSeconds}s read</span>
                      {row.savedAt && <span>· saved {timeAgo(row.savedAt)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link
                      href={`/paper/${row.cardId}`}
                      className="px-3 py-1.5 rounded-lg bg-white/8 border border-white/10 text-xs text-white/60 hover:bg-white/12 hover:text-white/80 transition-colors text-center"
                    >
                      View
                    </Link>
                    {row.arxivUrl && (
                      <a
                        href={row.arxivUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 hover:bg-blue-500/15 transition-colors text-center"
                      >
                        Paper ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
