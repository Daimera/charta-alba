import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type { CardGenerationInput, CardGenerationOutput } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY!);

const CardSchema = z.object({
  headline: z.string().max(80),
  hook: z.string().max(140),
  body: z.string().min(100).max(400),
  tldr: z.string().max(60),
  tags: z.array(z.string()).min(3).max(5),
  reading_time_seconds: z.number().int().min(15).max(90),
});

const SYSTEM_PROMPT = `You are an expert science communicator who turns dense AI/ML research
papers into punchy, consumer-grade explainer cards for a TikTok-style feed.

Return ONLY valid JSON matching this schema — no markdown fences, no extra keys:
{
  "headline": "scroll-stopping title ≤ 80 chars",
  "hook": "first sentence shown in feed ≤ 140 chars — must create curiosity",
  "body": "explainer body 100–400 chars — plain English, no jargon",
  "tldr": "bottom-bar summary ≤ 60 chars",
  "tags": ["tag1", "tag2", "tag3"],  // 3–5 topic tags, lowercase
  "reading_time_seconds": 30          // 15–90
}`;

export async function generateCard(
  input: CardGenerationInput
): Promise<CardGenerationOutput> {
  const userMessage = `Title: ${input.title}

Abstract: ${input.abstract}

Authors: ${input.authors.slice(0, 5).join(", ")}
Categories: ${input.categories.join(", ")}`;

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent(userMessage);
  const text = result.response.text();

  let parsed: unknown;
  try {
    // Strip potential markdown fences
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch {
    throw new Error(`Gemini returned non-JSON: ${text.slice(0, 200)}`);
  }

  const validated = CardSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Gemini output failed validation: ${validated.error.message}`);
  }

  return validated.data;
}
