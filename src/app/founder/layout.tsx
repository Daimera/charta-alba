import type { ReactNode } from "react";

export const metadata = {
  title: "Founder — Charta Alba",
  robots: { index: false, follow: false },
};

export default function FounderLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#060608]">
      {/* Minimal founder header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-11 flex items-center justify-between px-4 bg-black/90 backdrop-blur-sm border-b border-red-900/30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400/80 text-xs font-mono font-semibold tracking-widest uppercase">
            God Mode
          </span>
        </div>
        <span className="text-white/20 text-xs font-mono">Charta Alba — Founder Console</span>
      </header>
      <div className="pt-11">{children}</div>
    </div>
  );
}
