#!/usr/bin/env tsx
// dotenv MUST be the first import so env vars are available before any other
// module (especially src/lib/db) executes its top-level code.
// Note: tsx --env-file=.env.local (set in package.json scripts) is the primary
// mechanism; this is a fallback for direct invocations.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

/**
 * scripts/seed-arxiv.ts
 *
 * Fetches today's cs.AI + cs.LG papers from arXiv, upserts them into `papers`,
 * then generates and inserts explainer cards via Claude.
 *
 * Usage:
 *   npx tsx scripts/seed-arxiv.ts
 *   npx tsx scripts/seed-arxiv.ts --dry-run    # fetch + log, no DB writes
 *   npx tsx scripts/seed-arxiv.ts --limit 5    # process only N papers
 */
import { inArray } from "drizzle-orm";
import { db } from "../src/lib/db";
import { papers, cards } from "../src/lib/db/schema";
import { fetchDailyPapers } from "../src/lib/arxiv";
import { generateCard } from "../src/lib/claude";

const isDryRun = process.argv.includes("--dry-run");
const limitArg = process.argv.indexOf("--limit");
const limit = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : 50;

async function main() {
  console.log(`[seed-arxiv] Fetching up to ${limit} papers…`);
  const fetchedPapers = (await fetchDailyPapers(["cs.AI", "cs.LG"], limit)).slice(0, limit);
  console.log(`[seed-arxiv] Fetched ${fetchedPapers.length} papers`);

  if (isDryRun) {
    console.log("[seed-arxiv] Dry run — first paper sample:");
    console.dir(fetchedPapers[0], { depth: null });
    return;
  }

  // 1. Upsert papers
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
  console.log(`[seed-arxiv] Upserted ${paperRows.length} papers`);

  // 2. Generate cards for papers that don't have one yet
  const existingCards = await db
    .select({ paperId: cards.paperId })
    .from(cards)
    .where(inArray(cards.paperId, fetchedPapers.map((p) => p.id)));

  const papersWithCards = new Set(existingCards.map((c) => c.paperId));
  const toProcess = fetchedPapers.filter((p) => !papersWithCards.has(p.id));
  console.log(`[seed-arxiv] Generating cards for ${toProcess.length} new papers…`);

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
      process.stdout.write(".");
    } catch (err) {
      console.error(`\n[seed-arxiv] Card generation failed for ${paper.id}:`, err);
      failed++;
    }
  }

  console.log(`\n[seed-arxiv] Done. Cards: ${success} created, ${failed} failed.`);
}

main().catch((err) => {
  console.error("[seed-arxiv] Fatal:", err);
  process.exit(1);
});
