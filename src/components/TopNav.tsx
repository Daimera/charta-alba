"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCallback, useTransition, useEffect, useRef, useState } from "react";
import { setPreferredLanguage, type LanguageCode } from "@/components/LanguageSwitcher";
import { TierBadge } from "@/components/TierBadge";
import { LogoMark } from "@/components/LogoMark";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [, startTransition] = useTransition();

  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [userTier, setUserTier] = useState<string>("free");
  const [username, setUsername] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch points balance + tier
  useEffect(() => {
    if (!session?.user) {
      setPointsBalance(null);
      setUserTier("free");
      setUsername(null);
      return;
    }
    fetch("/api/points/balance")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { balance?: number; tier?: string } | null) => {
        if (d?.balance != null) setPointsBalance(d.balance);
        if (d?.tier) setUserTier(d.tier);
      })
      .catch(() => undefined);

    // Fetch username + preferred language from profile
    fetch("/api/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { profile?: { username?: string | null; preferredLanguage?: string | null } } | null) => {
        if (d?.profile?.username) setUsername(d.profile.username);
        // Hydrate language from DB — but only when DB has a non-default value.
        // If DB returns "en" (the column default), trust localStorage instead so
        // we don't overwrite a language the user saved before migrations were applied.
        // DB is always the source of truth — always sync to module store + localStorage
        // so the user's saved language follows them across devices and page loads.
        const dbLang = d?.profile?.preferredLanguage;
        if (dbLang) {
          setPreferredLanguage(dbLang as LanguageCode);
        }
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

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [dropdownOpen]);

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
      {/* Logo — animation handled by LogoMark's inline CSS (.lm-hover:hover) */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          background: "transparent",
          border: "none",
          padding: 0,
        }}
      >
        <LogoMark size={40} showGlow={true} />
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
            className="w-full bg-white/12 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/55 focus:outline-none focus:ring-1 focus:ring-white/30 focus:bg-white/15 transition-colors"
          />
        </div>
      )}

      {/* Auth */}
      {status === "loading" ? (
        <div className="w-16 h-7 rounded-lg bg-white/8 animate-pulse shrink-0" />
      ) : session?.user ? (
        <div className="flex items-center gap-2 shrink-0">
          {/* Points badge */}
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

          {/* Tier badge + avatar dropdown */}
          <div className="flex items-center gap-1.5">
            <TierBadge tier={userTier} />

            {/* Avatar / dropdown trigger */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                aria-label="Account menu"
                aria-expanded={dropdownOpen}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}
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
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: "#111",
                    border: "1px solid #222",
                    borderRadius: "8px",
                    minWidth: "210px",
                    zIndex: 100,
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                  }}
                >
                  {/* User info header */}
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #222" }}>
                    <p style={{ color: "#fff", fontSize: "14px", fontWeight: 600, margin: 0, lineHeight: 1.3 }}>
                      {session.user.name ?? "User"}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "2px 0 0", lineHeight: 1.3 }}>
                      {session.user.email}
                    </p>
                  </div>

                  {/* Nav items */}
                  {username && (
                    <DropdownLink href={`/profile/${username}`} onClick={() => setDropdownOpen(false)}>
                      Profile
                    </DropdownLink>
                  )}
                  <DropdownLink href="/settings" onClick={() => setDropdownOpen(false)}>
                    Settings
                  </DropdownLink>
                  <DropdownLink href="/points" onClick={() => setDropdownOpen(false)}>
                    Points{pointsBalance != null ? ` (${pointsBalance.toLocaleString()})` : ""}
                  </DropdownLink>
                  <DropdownLink href="/developers/dashboard" onClick={() => setDropdownOpen(false)}>
                    Developer
                  </DropdownLink>

                  {(session.user as { isFounder?: boolean }).isFounder && (
                    <DropdownLink href="/founder" onClick={() => setDropdownOpen(false)} color="#f59e0b">
                      Founder Console
                    </DropdownLink>
                  )}

                  {/* Divider */}
                  <div style={{ height: "1px", background: "#222", margin: "4px 0" }} />

                  {/* Sign out */}
                  <button
                    onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: "/" }); }}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "10px 16px", color: "#ef4444",
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: "14px",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget).style.background = "#1a1a1a"; }}
                    onMouseLeave={(e) => { (e.currentTarget).style.background = "none"; }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/auth/register"
            className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "#89CFF0", color: "#000" }}
          >
            Create account
          </Link>
          <Link
            href="/auth/signin"
            className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium text-white/80 hover:text-white transition-colors border border-white/25 hover:border-white/40"
          >
            Sign in
          </Link>
        </div>
      )}
    </nav>
  );
}

// Dropdown item helpers
function DropdownLink({
  href,
  onClick,
  color,
  children,
}: {
  href: string;
  onClick: () => void;
  color?: string;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "block",
        padding: "10px 16px",
        fontSize: "14px",
        color: color ?? (hovered ? "#fff" : "rgba(255,255,255,0.75)"),
        background: hovered ? "#1a1a1a" : "transparent",
        textDecoration: "none",
        transition: "background 0.1s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </Link>
  );
}
