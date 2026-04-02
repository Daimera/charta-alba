import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import type { ArxivEntry } from "@/types";

const ARXIV_BASE = "https://export.arxiv.org/api/query";
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchArxivWithRetry(url: string, attempt = 0): Promise<string> {
  // arXiv requires a minimum 3-second delay between requests
  await delay(3000);

  const response = await axios.get<string>(url, {
    headers: { "User-Agent": "ChartaAlba/0.1 (research paper feed)" },
    validateStatus: (status) => status < 500,
  });

  if (response.status === 429) {
    if (attempt >= 2) {
      throw new Error("arXiv API rate limit exceeded after 3 attempts");
    }
    const backoffMs = 30_000 * Math.pow(2, attempt); // 30s, 60s
    console.warn(`[arXiv] 429 rate limit — waiting ${backoffMs / 1000}s before retry ${attempt + 1}/2`);
    await delay(backoffMs);
    return fetchArxivWithRetry(url, attempt + 1);
  }

  if (response.status !== 200) {
    throw new Error(`arXiv API returned status ${response.status}`);
  }

  return response.data;
}

export async function fetchDailyPapers(
  categories: string[] = ["cs.AI", "cs.LG"],
  maxResults = 20
): Promise<ArxivEntry[]> {
  const query = categories.map((c) => `cat:${c}`).join("+OR+");
  const url =
    `${ARXIV_BASE}?search_query=${query}` +
    `&sortBy=submittedDate&sortOrder=descending` +
    `&max_results=${maxResults}`;

  const raw = await fetchArxivWithRetry(url);

  const parsed = parser.parse(raw);
  const entries: unknown[] = Array.isArray(parsed?.feed?.entry)
    ? parsed.feed.entry
    : parsed?.feed?.entry
    ? [parsed.feed.entry]
    : [];

  return entries.map(normalizeEntry).filter(Boolean) as ArxivEntry[];
}

function normalizeEntry(entry: unknown): ArxivEntry | null {
  if (!entry || typeof entry !== "object") return null;
  const e = entry as Record<string, unknown>;

  const rawId = String(e.id ?? "");
  // arXiv id is last segment of the URL e.g. http://arxiv.org/abs/2401.12345v1
  const id = rawId.split("/abs/").pop()?.replace(/v\d+$/, "") ?? rawId;

  const title = String(e.title ?? "")
    .replace(/\s+/g, " ")
    .trim();
  const abstract = String(e.summary ?? "")
    .replace(/\s+/g, " ")
    .trim();

  const authorRaw = e.author;
  const authorList: Array<Record<string, unknown>> = Array.isArray(authorRaw)
    ? (authorRaw as Array<Record<string, unknown>>)
    : authorRaw
    ? [authorRaw as Record<string, unknown>]
    : [];
  const authors = authorList.map((a) => String(a.name ?? "")).filter(Boolean);

  const categoryRaw = e.category;
  const categoryList: Array<Record<string, unknown>> = Array.isArray(categoryRaw)
    ? (categoryRaw as Array<Record<string, unknown>>)
    : categoryRaw
    ? [categoryRaw as Record<string, unknown>]
    : [];
  const categories = categoryList
    .map((c) => String(c["@_term"] ?? ""))
    .filter(Boolean);

  const published = String(e.published ?? "");
  const pdfUrl = `https://arxiv.org/pdf/${id}.pdf`;
  const arxivUrl = `https://arxiv.org/abs/${id}`;

  if (!id || !title) return null;

  return { id, title, abstract, authors, categories, published, pdfUrl, arxivUrl };
}
