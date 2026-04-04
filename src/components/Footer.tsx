import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/8 py-6 px-4 mt-auto">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-white/25 text-xs">
            © 2026 Charta Alba. Research, Reels, Repeat.
          </p>
          <p className="text-white/20 text-xs">
            Cookies: essential only &nbsp;·&nbsp; No advertising trackers
          </p>
        </div>
        <nav aria-label="Footer links" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {[
            { href: "/help", label: "Help" },
            { href: "/developers", label: "Developers" },
            { href: "/privacy", label: "Privacy" },
            { href: "/terms", label: "Terms" },
            { href: "/accessibility", label: "Accessibility" },
            { href: "/data#request", label: "Do Not Sell My Info" },
            { href: "mailto:support@chartaalba.com", label: "Contact" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-white/35 hover:text-white/70 text-xs transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
