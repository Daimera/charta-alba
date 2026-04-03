import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/8 py-6 px-4 mt-auto">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-white/25 text-xs">
          © 2026 Charta Alba. Research, Reels, Repeat.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {[
            { href: "/help", label: "Help" },
            { href: "/developers", label: "Developers" },
            { href: "/privacy", label: "Privacy" },
            { href: "/terms", label: "Terms" },
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
