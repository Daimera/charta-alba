"use client";

import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";

interface PersonalizationToastProps {
  onClose: () => void;
}

export function PersonalizationToast({ onClose }: PersonalizationToastProps) {
  const { data: session } = useSession();

  if (session) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 toast-enter">
      <div className="flex items-center gap-3 bg-[#1a1a2e] border border-white/15 rounded-2xl px-4 py-3 shadow-2xl max-w-xs">
        <span className="text-lg">✨</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">Your feed is learning</p>
          <p className="text-white/50 text-xs mt-0.5 truncate">Sign in to save your taste</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => signIn()}
            className="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors"
          >
            Sign in
          </button>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/70 transition-colors"
            aria-label="Dismiss"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
