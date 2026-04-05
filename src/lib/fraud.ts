/**
 * Fraud & quality detection for research papers.
 * Runs Claude-based analysis to flag problematic content.
 * Results stored on the cards table (fraud_risk_score, fraud_flags).
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { db } from "./db";
import { cards, papers } from "./db/schema";
import { eq, sql, and, isNull } from "drizzle-orm";

const client = new Anthropic();

const FraudResultSchema = z.object({
  riskScore: z.number().int().min(0).max(100),
  flags: z.array(z.string()),
  recommendation: z.enum(["publish", "review", "reject"]),
  explanation: z.string().max(1000),
});

export interface FraudCheckResult {
  riskScore: number;
  flags: string[];
  recommendation: "publish" | "review" | "reject";
  explanation: string;
}

export async function checkFraud(input: {
  title: string;
  abstract: string;
  headline: string;
  body: string;
}): Promise<FraudCheckResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: `You are a scientific integrity checker. Analyze this research summary for red flags:
1. Extraordinary claims without evidence
2. Missing methodology
3. Conflicts of interest signals
4. Statistical manipulation patterns
5. Predatory journal indicators
6. AI-generated content markers

Return ONLY valid JSON (no markdown fences):
{
  "riskScore": 0-100,
  "flags": ["flag1", "flag2"],
  "recommendation": "publish"|"review"|"reject",
  "explanation": "brief explanation max 200 chars"
}`,
    messages: [
      {
        role: "user",
        content: `Title: ${input.title}\n\nAbstract: ${input.abstract.slice(0, 1000)}\n\nSummary: ${input.headline}. ${input.body.slice(0, 500)}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in fraud check response");

  const parsed = FraudResultSchema.safeParse(JSON.parse(jsonMatch[0]));
  if (!parsed.success) throw new Error("Invalid fraud check schema");

  return parsed.data;
}

export async function generateSemanticFingerprint(input: {
  title: string;
  abstract: string;
}): Promise<string> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Summarize the core contribution of this research paper in EXACTLY 100 words. Be precise and capture the unique methodology and findings.

Title: ${input.title}
Abstract: ${input.abstract.slice(0, 1000)}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return text.trim().slice(0, 1000);
}

/**
 * Run fraud check and fingerprint on a card.
 * Updates the card row in place.
 * Returns the result.
 */
export async function runFraudCheckForCard(cardId: string): Promise<FraudCheckResult | null> {
  const [row] = await db
    .select({
      headline: cards.headline,
      body: cards.body,
      paperId: cards.paperId,
    })
    .from(cards)
    .where(eq(cards.id, cardId))
    .limit(1);

  if (!row) return null;

  const [paper] = await db
    .select({ title: papers.title, abstract: papers.abstract })
    .from(papers)
    .where(eq(papers.id, row.paperId))
    .limit(1);

  if (!paper) return null;

  const [result, fingerprint] = await Promise.all([
    checkFraud({
      title: paper.title,
      abstract: paper.abstract,
      headline: row.headline,
      body: row.body,
    }),
    generateSemanticFingerprint({ title: paper.title, abstract: paper.abstract }),
  ]);

  await db.update(cards).set({
    fraudRiskScore:    result.riskScore,
    fraudFlags:        result.flags,
    fraudCheckedAt:    new Date().toISOString(),
    semanticFingerprint: fingerprint,
  }).where(eq(cards.id, cardId));

  return result;
}

/**
 * Find potential duplicate papers using full-text search on semantic fingerprints.
 */
export async function findDuplicates(fingerprint: string, excludeCardId?: string): Promise<{
  cardId: string;
  headline: string;
  similarity: number;
}[]> {
  const escaped = fingerprint.replace(/'/g, "''");

  const rows = await db.execute(
    sql`SELECT id, headline,
        ts_rank(to_tsvector('english', COALESCE(semantic_fingerprint, '')),
                to_tsquery('english', ${escaped.split(/\s+/).slice(0, 10).map(w => w.replace(/[^a-z0-9]/gi, "")).filter(Boolean).join(" | ")})) AS rank
        FROM cards
        WHERE semantic_fingerprint IS NOT NULL
          ${excludeCardId ? sql`AND id != ${excludeCardId}::uuid` : sql``}
          AND to_tsvector('english', COALESCE(semantic_fingerprint, '')) @@
              to_tsquery('english', ${escaped.split(/\s+/).slice(0, 10).map(w => w.replace(/[^a-z0-9]/gi, "")).filter(Boolean).join(" | ")})
        ORDER BY rank DESC
        LIMIT 5`
  );

  return (rows.rows as Array<{ id: string; headline: string; rank: number }>)
    .filter(r => r.rank > 0.1)
    .map(r => ({ cardId: r.id, headline: r.headline, similarity: r.rank }));
}
