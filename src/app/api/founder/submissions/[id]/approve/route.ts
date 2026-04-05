import { authenticateFounder } from "@/middleware/founderAuth";
import { db } from "@/lib/db";
import { submissions, papers, cards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateCard } from "@/lib/claude";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const fa = await authenticateFounder(_req, 2);
  if (!fa.ok) return fa.response;

  const { id } = await params;

  const [sub] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, id))
    .limit(1);

  if (!sub) {
    return Response.json({ error: "Submission not found" }, { status: 404 });
  }
  if (sub.status === "published") {
    return Response.json({ error: "Already published" }, { status: 409 });
  }

  // Create a synthetic paper entry
  const paperId = `sub-${sub.id}`;
  await db.insert(papers).values({
    id: paperId,
    title: sub.title,
    abstract: sub.abstract,
    authors: sub.authors.split(",").map(a => a.trim()),
    categories: sub.category ? [sub.category] : ["Other"],
    pdfUrl: sub.pdfUrl ?? null,
    arxivUrl: sub.externalUrl ?? null,
    publishedAt: new Date().toISOString(),
  }).onConflictDoNothing();

  // Generate card
  const cardData = await generateCard({
    paperId,
    title: sub.title,
    abstract: sub.abstract,
    authors: sub.authors.split(",").map(a => a.trim()),
    categories: sub.category ? [sub.category] : ["Other"],
  });

  const [card] = await db.insert(cards).values({
    paperId,
    headline: cardData.headline,
    hook: cardData.hook,
    body: cardData.body,
    tldr: cardData.tldr,
    tags: cardData.tags,
    readingTimeSeconds: cardData.reading_time_seconds,
    replicationStatus: sub.peerReviewed ? "replicated" : "preprint",
  }).returning({ id: cards.id });

  // Mark submission as published
  await db.update(submissions).set({
    status: "published",
    publishedCardId: card.id,
    aiProcessedAt: new Date().toISOString(),
  }).where(eq(submissions.id, id));

  return Response.json({ ok: true, cardId: card.id });
}
