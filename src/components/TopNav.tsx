"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useTransition } from "react";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [, startTransition] = useTransition();

  const handleSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-black/85 backdrop-blur-md border-b border-white/8">
      {/* Logo */}
      <Link
        href="/"
        className="text-white font-bold text-base tracking-tight shrink-0 hover:text-white/80 transition-colors"
      >
        Charta Alba
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1 mx-4">
        <Link
          href="/"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/" ? "bg-white/12 text-white" : "text-white/50 hover:text-white hover:bg-white/8"
          }`}
        >
          Feed
        </Link>
        <Link
          href="/top"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/top" ? "bg-white/12 text-white" : "text-white/50 hover:text-white hover:bg-white/8"
          }`}
        >
          Top
        </Link>
        <Link
          href="/digest"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/digest" ? "bg-white/12 text-white" : "text-white/50 hover:text-white hover:bg-white/8"
          }`}
        >
          Digest
        </Link>
        <Link
          href="/videos"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/videos" ? "bg-white/12 text-white" : "text-white/50 hover:text-white hover:bg-white/8"
          }`}
        >
          Videos
        </Link>
        <Link
          href="/circles"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            pathname.startsWith("/circles") ? "bg-white/12 text-white" : "text-white/50 hover:text-white hover:bg-white/8"
          }`}
        >
          Circles
        </Link>
      </div>

      {/* Search — only on feed page */}
      {pathname === "/" && (
        <div className="flex-1 max-w-48 mx-2">
          <input
            type="search"
            placeholder="Search papers…"
            defaultValue={searchParams.get("q") ?? ""}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-white/8 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-white/25 focus:bg-white/10 transition-colors"
          />
        </div>
      )}

      {/* Auth */}
      {session?.user ? (
        <Link
          href="/settings"
          className="flex items-center gap-2 shrink-0"
          title="Settings"
        >
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={session.user.name ?? "User"}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20 hover:ring-white/40 transition-all"
            />
          ) : (
            <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-xs text-white font-medium hover:bg-white/25 transition-colors">
              {(session.user.name ?? session.user.email ?? "?")[0].toUpperCase()}
            </span>
          )}
        </Link>
      ) : (
        <Link
          href="/auth/signin"
          className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-black hover:bg-white/90 transition-colors"
        >
          Sign in
        </Link>
      )}
    </nav>
  );
}
