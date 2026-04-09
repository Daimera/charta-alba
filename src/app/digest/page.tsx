export const dynamic = "force-dynamic";

import Link from "next/link";
import { auth } from "@/lib/auth";
import { loadTop } from "@/lib/queries";
import { ReplicationBadge } from "@/components/ReplicationBadge";
import DigestSubscribeForm from "./DigestSubscribeForm";
import { LogoMark } from "@/components/LogoMark";
import type { Metadata } from "next";

const WALL_LIMIT = 2;

export const metadata: Metadata = {
  title: "Weekly Digest — Charta Alba",
  description: "This week's top 5 AI/ML papers, distilled into 60-second reads.",
};

export default async function DigestPage() {
  const [session, topCards] = await Promise.all([auth(), loadTop("week")]);
  const loggedIn = !!session?.user?.id;
  const top5 = topCards.slice(0, 5);
  const displayCards = loggedIn ? top5 : top5.slice(0, WALL_LIMIT);

  const weekLabel = (() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  })();

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-5">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-2">
            Week of {weekLabel}
          </p>
          <h1 className="text-4xl font-bold text-white mb-3">Weekly Digest</h1>
          <p className="text-white/50 text-base">
            This week&apos;s 5 most-liked AI&nbsp;&amp;&nbsp;ML papers, distilled into 60-second reads.
          </p>
        </div>

        {/* Paper list */}
        {top5.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-10">
            No data yet for this week — check back soon.
          </p>
        ) : (
          <>
          <ol className="space-y-6">
            {displayCards.map((card, i) => (
              <li key={card.id}>
                <a
                  href={`/paper/${card.id}`}
                  className="block rounded-2xl bg-white/4 border border-white/8 px-6 py-5 hover:bg-white/6 transition-colors group"
                >
                  {/* Position + badge */}
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`text-2xl font-black tabular-nums ${
                        i === 0
                          ? "text-yellow-400"
                          : i === 1
                          ? "text-slate-300"
                          : i === 2
                          ? "text-amber-600"
                          : "text-white/25"
                      }`}
                    >
                      #{i + 1}
                    </span>
                    {card.replicationStatus && (
                      <ReplicationBadge status={card.replicationStatus} />
                    )}
                    <span className="ml-auto text-white/30 text-xs tabular-nums">
                      {card.likeCount.toLocaleString()} likes
                    </span>
                  </div>

                  {/* Headline */}
                  <h2 className="text-white font-bold text-lg leading-snug mb-2 group-hover:text-white/90">
                    {card.headline}
                  </h2>

                  {/* Hook */}
                  <p className="text-white/55 text-sm leading-relaxed mb-3">{card.hook}</p>

                  {/* TLDR */}
                  <div className="rounded-xl bg-white/4 border border-white/6 px-3 py-2 mb-3">
                    <span className="text-white/25 text-xs font-semibold uppercase tracking-widest">
                      TL;DR&nbsp;
                    </span>
                    <span className="text-white/70 text-xs">{card.tldr}</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {card.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-white/35 bg-white/5 px-2 py-0.5 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </a>
              </li>
            ))}
          </ol>
          {!loggedIn && top5.length > WALL_LIMIT && (
            <div className="mt-8 flex flex-col items-center gap-4 py-10 px-6 text-center rounded-2xl bg-white/3 border border-white/8">
              <LogoMark size={44} color="#89CFF0" showGlow={true} />
              <h2 className="text-lg font-bold text-white">Read the full digest</h2>
              <p className="text-white/50 text-sm">Join free to see all 5 papers in this week&apos;s digest.</p>
              <Link
                href="/auth/register"
                className="w-full py-2.5 rounded-full text-sm font-semibold text-black transition-opacity hover:opacity-90"
                style={{ background: "#89CFF0" }}
              >
                Create account
              </Link>
              <Link href="/auth/signin" className="text-white/50 text-sm hover:text-white transition-colors">
                Sign in
              </Link>
            </div>
          )}
          </>
        )}

        {/* Subscribe section */}
        <div className="mt-12 rounded-2xl bg-white/4 border border-white/8 px-6 py-7 text-center">
          <h2 className="text-white font-semibold text-lg mb-1">
            Get this in your inbox every Monday
          </h2>
          <p className="text-white/40 text-sm mb-5">
            No spam. Just the week&apos;s best AI research, condensed.
          </p>
          <DigestSubscribeForm />
        </div>
      </div>
    </main>
  );
}
