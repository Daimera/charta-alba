import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { CardGenerationInput, CardGenerationOutput } from "@/types";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

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

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Claude returned non-JSON: ${text.slice(0, 200)}`);
  }

  const result = CardSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Claude output failed validation: ${result.error.message}`);
  }

  return result.data;
}
