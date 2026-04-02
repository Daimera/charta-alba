import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCardWithPaper } from "@/lib/queries";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const card = await getCardWithPaper(id);

  if (!card) {
    return { title: "Paper not found — Charta Alba" };
  }

  const description = card.hook ?? card.tldr ?? "";
  const title = `${card.headline} — Charta Alba`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Charta Alba",
      type: "article",
      tags: card.tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PaperPage({ params }: Props) {
  const { id } = await params;
  const card = await getCardWithPaper(id);

  if (!card) notFound();

  return (
    <main className="min-h-dvh bg-[#0a0a0a] pt-14">
      <div className="max-w-lg mx-auto px-5 py-8">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-0.5 rounded-full bg-white/8 text-white/50"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Headline */}
        <h1 className="text-2xl font-bold text-white leading-tight tracking-tight mb-4">
          {card.headline}
        </h1>

        {/* Hook */}
        <p className="text-white/75 text-base leading-relaxed mb-3">{card.hook}</p>

        {/* Body */}
        <p className="text-white/55 text-sm leading-relaxed mb-6">{card.body}</p>

        {/* TL;DR */}
        <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-3 mb-6">
          <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-1">
            TL;DR
          </p>
          <p className="text-white/85 text-sm font-medium leading-snug">{card.tldr}</p>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-sm mb-8">
          <span className="text-white/30 tabular-nums">{card.readingTimeSeconds}s read</span>
          <div className="flex items-center gap-3">
            {card.arxivUrl && (
              <a
                href={card.arxivUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400/80 hover:text-blue-400 transition-colors flex items-center gap-1 text-sm"
              >
                Read paper
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15,3 21,3 21,9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Paper title if available */}
        {card.paperTitle && (
          <div className="border-t border-white/8 pt-6">
            <p className="text-white/25 text-xs font-medium uppercase tracking-wide mb-2">
              Original paper
            </p>
            <p className="text-white/50 text-sm italic">{card.paperTitle}</p>
          </div>
        )}

        {/* Back to feed */}
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6" />
            </svg>
            Back to feed
          </Link>
        </div>
      </div>
    </main>
  );
}
