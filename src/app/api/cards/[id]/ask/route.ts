import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cards, papers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// In-memory rate limit: 5 requests per user per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(session.user.id)) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { id: cardId } = await params;
  const body = await req.json();
  const question: string = body.question ?? "";

  if (!question.trim() || question.length > 500) {
    return Response.json({ error: "Invalid question" }, { status: 400 });
  }

  const [result] = await db
    .select({
      headline: cards.headline,
      body: cards.body,
      tldr: cards.tldr,
      abstract: papers.abstract,
      title: papers.title,
    })
    .from(cards)
    .leftJoin(papers, eq(cards.paperId, papers.id))
    .where(eq(cards.id, cardId));

  if (!result) {
    return Response.json({ error: "Card not found" }, { status: 404 });
  }

  const systemPrompt = `You are a helpful assistant explaining an AI/ML research paper in plain language.

Paper title: "${result.title ?? "Unknown"}"
Summary: ${result.headline}
Abstract: ${result.abstract ?? "Not available"}

Answer questions clearly and concisely. Keep answers under 200 words. Avoid excessive jargon — explain as if talking to a curious non-expert.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: "user", content: question.trim() }],
  });

  const answer =
    message.content[0].type === "text" ? message.content[0].text : "";

  return Response.json({ answer });
}
