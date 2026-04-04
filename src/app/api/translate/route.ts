import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { translations, cards } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { checkRateLimit, getIpFromRequest } from "@/lib/rate-limit";
import { assertUUID } from "@/lib/sanitize";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  ar: "Arabic",
  hi: "Hindi",
  ja: "Japanese",
  ko: "Korean",
  "zh-CN": "Simplified Chinese",
  "zh-TW": "Traditional Chinese",
  ru: "Russian",
  it: "Italian",
  nl: "Dutch",
  tr: "Turkish",
  pl: "Polish",
  sv: "Swedish",
  id: "Indonesian",
  vi: "Vietnamese",
  th: "Thai",
};

const TranslationSchema = z.object({
  headline: z.string().max(200),
  hook: z.string().max(500),
  body: z.string().max(4000),
  tldr: z.string().max(300),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 20 translations per hour per user
    const rl = checkRateLimit(`translate:${session.user.id}`, 20, 60 * 60 * 1000);
    if (!rl.allowed) {
      return Response.json(
        { error: "Translation rate limit reached. Try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const ip = getIpFromRequest(req);
    const rlIp = checkRateLimit(`translate-ip:${ip}`, 40, 60 * 60 * 1000);
    if (!rlIp.allowed) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json() as { cardId?: unknown; language?: unknown };

    // Validate card ID
    const uuidError = assertUUID(body.cardId);
    if (uuidError) return uuidError;
    const cardId = body.cardId as string;

    // Validate language
    if (typeof body.language !== "string" || !SUPPORTED_LANGUAGES[body.language]) {
      return Response.json({ error: "Unsupported language" }, { status: 400 });
    }
    const language = body.language;

    // Check cache first
    const [cached] = await db
      .select()
      .from(translations)
      .where(
        and(
          eq(translations.contentType, "card"),
          eq(translations.contentId, cardId),
          eq(translations.languageCode, language)
        )
      )
      .limit(1);

    if (cached) {
      // Update last_used_at in background
      db.update(translations)
        .set({ lastUsedAt: new Date().toISOString() })
        .where(eq(translations.id, cached.id))
        .catch(() => undefined);

      return Response.json({
        headline: cached.translatedHeadline,
        hook: cached.translatedHook,
        body: cached.translatedBody,
        tldr: cached.translatedTldr,
        cached: true,
      });
    }

    // Fetch the original card
    const [card] = await db
      .select({
        headline: cards.headline,
        hook: cards.hook,
        body: cards.body,
        tldr: cards.tldr,
      })
      .from(cards)
      .where(eq(cards.id, cardId))
      .limit(1);

    if (!card) {
      return Response.json({ error: "Card not found" }, { status: 404 });
    }

    // Translate with Claude
    const client = new Anthropic();
    const langName = SUPPORTED_LANGUAGES[language];

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Translate the following research paper explainer card content into ${langName}.
Return ONLY valid JSON with keys: headline, hook, body, tldr.
Preserve the tone (accessible, engaging, non-technical). Do not add or remove information.

INPUT:
${JSON.stringify({
  headline: card.headline,
  hook: card.hook,
  body: card.body,
  tldr: card.tldr,
})}`,
        },
      ],
    });

    const rawText = message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response (handle potential markdown code blocks)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[api/translate] No JSON in Claude response:", rawText);
      return Response.json({ error: "Translation failed" }, { status: 502 });
    }

    const parsed = TranslationSchema.safeParse(JSON.parse(jsonMatch[0]));
    if (!parsed.success) {
      console.error("[api/translate] Invalid translation schema:", parsed.error);
      return Response.json({ error: "Translation validation failed" }, { status: 502 });
    }

    const result = parsed.data;

    // Cache the translation
    await db
      .insert(translations)
      .values({
        contentType: "card",
        contentId: cardId,
        languageCode: language,
        translatedHeadline: result.headline,
        translatedHook: result.hook,
        translatedBody: result.body,
        translatedTldr: result.tldr,
      })
      .onConflictDoUpdate({
        target: [translations.contentType, translations.contentId, translations.languageCode],
        set: {
          translatedHeadline: result.headline,
          translatedHook: result.hook,
          translatedBody: result.body,
          translatedTldr: result.tldr,
          lastUsedAt: new Date().toISOString(),
        },
      });

    return Response.json({ ...result, cached: false });
  } catch (err) {
    console.error("[api/translate]", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
