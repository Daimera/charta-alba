"use client";

import { useState, useEffect } from "react";

interface TagFilterBarProps {
  tags: string[];
  active: string[];
  onChange: (tags: string[]) => void;
}

export function TagFilterBar({ tags, active, onChange }: TagFilterBarProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (tags.length === 0) return null;

  // Use empty array before hydration to match server render
  const effectiveActive = mounted ? active : [];

  const toggle = (tag: string) => {
    onChange(effectiveActive.includes(tag)
      ? effectiveActive.filter((t) => t !== tag)
      : [...effectiveActive, tag]);
  };

  return (
    <div className="fixed top-14 left-0 right-0 z-40 flex items-center gap-2 px-4 py-2 overflow-x-auto hide-scrollbar bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
      {effectiveActive.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="shrink-0 px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white/70 border border-white/20 hover:bg-white/20 transition-colors pointer-events-auto"
        >
          Clear
        </button>
      )}
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => toggle(tag)}
          className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors pointer-events-auto ${
            effectiveActive.includes(tag)
              ? "bg-white text-black border-white"
              : "bg-transparent text-white/55 border-white/15 hover:border-white/30 hover:text-white/80"
          }`}
        >
          #{tag}
        </button>
      ))}
    </div>
  );
}
