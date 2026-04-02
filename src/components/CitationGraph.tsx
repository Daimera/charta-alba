import Link from "next/link";
import type { CitationLink } from "@/types";

interface CitationGraphProps {
  citations: CitationLink[];
}

export function CitationGraph({ citations }: CitationGraphProps) {
  if (citations.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-white/25 text-xs font-semibold uppercase tracking-widest mb-2">
        Related Papers
      </p>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {citations.map((c) => (
          <Link
            key={c.cardId}
            href={`/paper/${c.cardId}`}
            className="shrink-0 w-44 rounded-xl bg-white/5 border border-white/8 px-3 py-2.5 hover:bg-white/8 transition-colors"
          >
            <p className="text-white/80 text-xs font-medium leading-snug line-clamp-2 mb-1.5">
              {c.headline}
            </p>
            <div className="flex flex-wrap gap-1">
              {c.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] text-white/35 bg-white/5 px-1.5 py-0.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
