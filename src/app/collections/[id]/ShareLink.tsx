"use client";

import { useState } from "react";

export function ShareLink({ collectionId }: { collectionId: string }) {
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/collections/${collectionId}`
    : `/collections/${collectionId}`;

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the text
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="w-full mb-6 flex items-center gap-2 bg-white/4 border border-white/8 rounded-xl px-4 py-2.5 hover:bg-white/6 transition-colors text-left"
    >
      <span className="text-white/35 text-xs flex-1 truncate font-mono">{url}</span>
      <span className="text-white/40 text-xs shrink-0">
        {copied ? "Copied ✓" : "Copy link"}
      </span>
    </button>
  );
}
