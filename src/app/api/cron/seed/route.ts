import { NextRequest, NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { papers, cards } from "@/lib/db/schema";
import { fetchDailyPapers } from "@/lib/arxiv";
import { generateCard } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min — Vercel Pro limit; free tier cap is 60s

export async function GET(req: NextRequest) {
  const secret =
    req.headers.get("x-cron-secret") ??
    req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fetchedPapers = await fetchDailyPapers(["cs.AI", "cs.LG"], 30);

  const paperRows = fetchedPapers.map((p) => ({
    id: p.id,
    title: p.title,
    abstract: p.abstract,
    authors: p.authors,
    categories: p.categories,
    publishedAt: p.published,
    pdfUrl: p.pdfUrl,
    arxivUrl: p.arxivUrl,
  }));

  await db.insert(papers).values(paperRows).onConflictDoNothing();

  const existingCards = await db
    .select({ paperId: cards.paperId })
    .from(cards)
    .where(inArray(cards.paperId, fetchedPapers.map((p) => p.id)));

  const papersWithCards = new Set(existingCards.map((c) => c.paperId));
  const toProcess = fetchedPapers.filter((p) => !papersWithCards.has(p.id));

  let success = 0;
  let failed = 0;

  for (const paper of toProcess) {
    try {
      const card = await generateCard({
        paperId: paper.id,
        title: paper.title,
        abstract: paper.abstract,
        authors: paper.authors,
        categories: paper.categories,
      });

      await db.insert(cards).values({
        paperId: paper.id,
        headline: card.headline,
        hook: card.hook,
        body: card.body,
        tldr: card.tldr,
        tags: card.tags,
        readingTimeSeconds: card.reading_time_seconds,
      });

      success++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    papersUpserted: paperRows.length,
    cardsCreated: success,
    cardsFailed: failed,
  });
}
