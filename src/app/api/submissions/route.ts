import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { checkRateLimit, getIpFromRequest } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/sanitize";
import { isAllowedVideoUrl, isAllowedImageUrl } from "@/lib/validateUrl";

const ALLOWED_TYPES = ["paper", "white_paper", "discovery", "dataset"] as const;
type SubmissionType = (typeof ALLOWED_TYPES)[number];

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch { return false; }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getIpFromRequest(req);
    const rl = checkRateLimit(`submissions:${session.user.id}`, 5, 60 * 60 * 1000); // 5/hr
    if (!rl.allowed) {
      return Response.json({ error: "Submission rate limit reached. Try again later." }, { status: 429 });
    }

    const body = await req.json() as Record<string, unknown>;

    // Validate type
    if (!ALLOWED_TYPES.includes(body.submissionType as SubmissionType)) {
      return Response.json({ error: "Invalid submission type" }, { status: 400 });
    }

    const title = sanitizeString(body.title, 300);
    const authors = sanitizeString(body.authors, 1000);
    const abstract = sanitizeString(body.abstract, 5000);

    if (!title?.trim()) return Response.json({ error: "Title is required" }, { status: 400 });
    if (!authors?.trim()) return Response.json({ error: "Authors are required" }, { status: 400 });
    if (!abstract?.trim()) return Response.json({ error: "Abstract is required" }, { status: 400 });

    // Validate URLs
    const externalUrl = sanitizeString(body.externalUrl, 500)?.trim() || null;
    const pdfUrl = sanitizeString(body.pdfUrl, 500)?.trim() || null;

    if (externalUrl && !isValidUrl(externalUrl)) {
      return Response.json({ error: "Invalid external URL" }, { status: 400 });
    }
    if (pdfUrl && !isValidUrl(pdfUrl)) {
      return Response.json({ error: "Invalid PDF URL" }, { status: 400 });
    }

    const [sub] = await db.insert(submissions).values({
      userId:           session.user.id,
      submissionType:   body.submissionType as SubmissionType,
      title:            title.trim(),
      authors:          authors.trim(),
      abstract:         abstract.trim(),
      externalUrl,
      pdfUrl,
      doi:              sanitizeString(body.doi, 100)?.trim() || null,
      journalName:      sanitizeString(body.journalName, 200)?.trim() || null,
      organization:     sanitizeString(body.organization, 200)?.trim() || null,
      category:         sanitizeString(body.category, 50)?.trim() || null,
      datasetSize:      sanitizeString(body.datasetSize, 50)?.trim() || null,
      datasetFormat:    sanitizeString(body.datasetFormat, 100)?.trim() || null,
      datasetLicense:   sanitizeString(body.datasetLicense, 100)?.trim() || null,
      versionNumber:    sanitizeString(body.versionNumber, 20)?.trim() || null,
      methodology:      sanitizeString(body.methodology, 2000)?.trim() || null,
      fieldOfDiscovery: sanitizeString(body.fieldOfDiscovery, 200)?.trim() || null,
      peerReviewed:     body.peerReviewed === true,
      status:           "pending",
    }).returning({ id: submissions.id });

    // Kick off AI processing in background (fire-and-forget)
    processSubmission(sub.id, session.user.id).catch(err =>
      console.error("[submissions] background AI processing error:", err)
    );

    return Response.json({ ok: true, submissionId: sub.id });
  } catch (err) {
    console.error("[api/submissions]", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eq } = await import("drizzle-orm");
  const mySubmissions = await db
    .select()
    .from(submissions)
    .where(eq(submissions.userId, session.user.id))
    .orderBy(submissions.createdAt);

  return Response.json({ submissions: mySubmissions });
}

async function processSubmission(submissionId: string, userId: string) {
  const { eq } = await import("drizzle-orm");
  const { generateCard } = await import("@/lib/claude");

  // Mark as processing
  await db.update(submissions).set({ status: "ai_processing" }).where(eq(submissions.id, submissionId));

  const [sub] = await db.select().from(submissions).where(eq(submissions.id, submissionId)).limit(1);
  if (!sub) return;

  // Fetch PDF text if available (first 50k chars)
  let pdfContext = "";
  if (sub.pdfUrl) {
    try {
      const res = await fetch(sub.pdfUrl, { signal: AbortSignal.timeout(10_000) });
      if (res.ok) {
        const text = await res.text();
        pdfContext = text.slice(0, 50_000);
      }
    } catch {
      // ignore PDF fetch errors
    }
  }

  const enhancedAbstract = pdfContext
    ? `${sub.abstract}\n\n--- Additional context from PDF ---\n${pdfContext.slice(0, 3000)}`
    : sub.abstract;

  const card = await generateCard({
    paperId: sub.id,
    title: sub.title,
    abstract: enhancedAbstract,
    authors: sub.authors.split(",").map(a => a.trim()),
    categories: sub.category ? [sub.category] : [],
  });

  // Store suggested tags back on submission
  await db.update(submissions)
    .set({
      suggestedTags: card.tags,
      status: "pending", // back to pending for founder review
      aiProcessedAt: new Date().toISOString(),
    })
    .where(eq(submissions.id, submissionId));
}
