export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ReplicationBadge } from "@/components/ReplicationBadge";
import { ShareLink } from "./ShareLink";
import type { Metadata } from "next";

interface CollectionItem {
  addedAt: string | null;
  id: string;
  paperId: string;
  headline: string;
  hook: string;
  tldr: string;
  tags: string[];
  likeCount: number;
  replicationStatus: string | null;
  arxivUrl: string | null;
  paperTitle: string | null;
}

interface CollectionData {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string | null;
}

async function getCollection(id: string) {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/collections/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json() as Promise<{ collection: CollectionData; items: CollectionItem[] }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getCollection(id);
  if (!data) return { title: "Collection — Charta Alba" };
  return {
    title: `${data.collection.name} — Charta Alba`,
    description: data.collection.description ?? "A curated collection of AI/ML papers.",
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCollection(id);
  if (!data) notFound();

  const { collection, items } = data;

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-5">
        <Link
          href="/"
          className="text-white/30 text-sm hover:text-white/50 transition-colors mb-6 inline-block"
        >
          ← Back to feed
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-white">{collection.name}</h1>
            {collection.isPublic && (
              <span className="text-xs text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Public
              </span>
            )}
          </div>
          {collection.description && (
            <p className="text-white/45 text-sm mt-1">{collection.description}</p>
          )}
          <p className="text-white/25 text-xs mt-2">
            {items.length} paper{items.length !== 1 ? "s" : ""}
          </p>
        </div>

        {collection.isPublic && <ShareLink collectionId={collection.id} />}

        {/* Items */}
        {items.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-10">
            No papers in this collection yet.
          </p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/paper/${item.id}`}
                className="block rounded-2xl bg-white/4 border border-white/8 px-5 py-4 hover:bg-white/6 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-2">
                  {item.replicationStatus && (
                    <ReplicationBadge status={item.replicationStatus} />
                  )}
                  <span className="ml-auto text-white/25 text-xs tabular-nums">
                    {item.likeCount.toLocaleString()} likes
                  </span>
                </div>

                <h2 className="text-white font-semibold text-base leading-snug mb-1.5 group-hover:text-white/90">
                  {item.headline}
                </h2>
                <p className="text-white/45 text-sm leading-relaxed mb-2.5 line-clamp-2">
                  {item.hook}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {item.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
