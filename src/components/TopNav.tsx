"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useTransition, useEffect, useRef, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { TierBadge } from "@/components/TierBadge";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [, startTransition] = useTransition();
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [userTier, setUserTier] = useState<string>("free");
  const [logoHovered, setLogoHovered] = useState(false);
  const logoVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!session?.user) { setPointsBalance(null); setUserTier("free"); return; }
    fetch("/api/points/balance")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { balance?: number; tier?: string } | null) => {
        if (d?.balance != null) setPointsBalance(d.balance);
        if (d?.tier) setUserTier(d.tier);
      })
      .catch(() => undefined);
  }, [session?.user]);

  // Record login session once per browser session
  useEffect(() => {
    if (!session?.user) return;
    if (sessionStorage.getItem("loginRecorded")) return;
    sessionStorage.setItem("loginRecorded", "1");
    fetch("/api/auth/record-login", { method: "POST" }).catch(() => undefined);
  }, [session?.user]);

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

  function handleLogoMouseEnter() {
    setLogoHovered(true);
    logoVideoRef.current?.play().catch(() => undefined);
  }

  function handleLogoMouseLeave() {
    setLogoHovered(false);
    const v = logoVideoRef.current;
    if (v) { v.pause(); v.currentTime = 0; }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-black/85 backdrop-blur-md border-b border-white/8">
      {/* Logo */}
      <Link
        href="/"
        className="shrink-0"
        onMouseEnter={handleLogoMouseEnter}
        onMouseLeave={handleLogoMouseLeave}
      >
        <Image
          src="/logo-diamond.png"
          alt="Charta Alba"
          width={120}
          height={36}
          style={{ height: "36px", width: "auto", display: logoHovered ? "none" : "block" }}
          priority
        />
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={logoVideoRef}
          src="/logo-animation-diamond.mp4"
          muted
          playsInline
          style={{
            height: "36px",
            width: "auto",
            display: logoHovered ? "block" : "none",
            mixBlendMode: "screen",
          }}
        />
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
          href="/following"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/following" ? "bg-white/12 text-white" : "text-white/50 hover:text-white hover:bg-white/8"
          }`}
        >
          Following
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

      {/* Language switcher */}
      <LanguageSwitcher />

      {/* Auth */}
      {session?.user ? (
        <div className="flex items-center gap-2 shrink-0">
          {/* Points balance */}
          <Link
            href="/points"
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/15 transition-colors"
            title="Your points"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 9l10 13L22 9z" /></svg>
            <span className="text-xs font-semibold tabular-nums">
              {pointsBalance != null ? pointsBalance.toLocaleString() : "—"}
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <TierBadge tier={userTier} />
            <Link
              href="/settings"
              className="flex items-center"
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
          </div>
        </div>
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
