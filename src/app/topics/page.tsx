import { db } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function loadTopics(): Promise<{ tag: string; count: number }[]> {
  // Unnest the tags array and count occurrences
  const rows = await db.execute(
    sql`SELECT tag, COUNT(*)::int AS count
        FROM cards, unnest(tags) AS tag
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 200`
  );
  return (rows.rows as { tag: string; count: number }[]) ?? [];
}

export default async function TopicsPage() {
  const topics = await loadTopics();

  // Group alphabetically
  const groups: Record<string, { tag: string; count: number }[]> = {};
  for (const t of topics) {
    const letter = t.tag[0]?.toUpperCase() ?? "#";
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(t);
  }
  const sortedLetters = Object.keys(groups).sort();

  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold tracking-tight">Topics</h1>
          <p className="text-white/40 text-sm mt-1">{topics.length} topics across all papers</p>
        </div>

        {topics.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-16">No topics yet — seed some papers first.</p>
        ) : (
          <div className="space-y-6">
            {sortedLetters.map((letter) => (
              <div key={letter}>
                <p className="text-white/25 text-xs font-bold uppercase tracking-widest mb-2 pl-1">{letter}</p>
                <div className="flex flex-wrap gap-2">
                  {groups[letter].map(({ tag, count }) => (
                    <Link
                      key={tag}
                      href={`/?q=${encodeURIComponent(tag)}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors"
                    >
                      <span className="text-sm text-white/75 font-medium">#{tag}</span>
                      <span className="text-xs text-white/30 tabular-nums">{count}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
