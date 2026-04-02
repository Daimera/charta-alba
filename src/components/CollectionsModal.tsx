"use client";

import { useState, useEffect } from "react";
import type { Collection } from "@/types";

interface CollectionsModalProps {
  cardId: string;
  onClose: () => void;
}

export function CollectionsModal({ cardId, onClose }: CollectionsModalProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/collections")
      .then((r) => r.json())
      .then((data) => setCollections(data.collections ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (collectionId: string) => {
    setAdded((prev) => ({ ...prev, [collectionId]: true }));
    await fetch(`/api/collections/${collectionId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId }),
    });
  };

  const handleCreate = async () => {
    if (!newName.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), isPublic }),
      });
      const data = await res.json();
      if (data.collection) {
        setCollections((prev) => [data.collection, ...prev]);
        setNewName("");
        setCreating(false);
        // Immediately add card to the new collection
        await handleAdd(data.collection.id);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="absolute bottom-0 left-0 right-0 bg-[#111] border-t border-white/10 rounded-t-2xl drawer-enter max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <h2 className="text-white font-semibold">Save to Collection</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {loading ? (
            <p className="text-white/30 text-sm py-4 text-center">Loading…</p>
          ) : collections.length === 0 && !creating ? (
            <p className="text-white/30 text-sm py-4 text-center">No collections yet.</p>
          ) : (
            collections.map((col) => (
              <div
                key={col.id}
                className="flex items-center justify-between py-2.5 border-b border-white/5"
              >
                <div>
                  <p className="text-white/85 text-sm font-medium">{col.name}</p>
                  {col.isPublic && (
                    <p className="text-white/35 text-xs">Public · shareable</p>
                  )}
                </div>
                <button
                  onClick={() => handleAdd(col.id)}
                  disabled={added[col.id]}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    added[col.id]
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/10 text-white/70 hover:bg-white/15"
                  }`}
                >
                  {added[col.id] ? "Added ✓" : "Add"}
                </button>
              </div>
            ))
          )}

          {/* Create new form */}
          {creating ? (
            <div className="pt-2 space-y-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Collection name…"
                className="w-full bg-white/8 border border-white/12 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/25"
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded"
                />
                <span className="text-white/55 text-xs">Make public (shareable link)</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || submitting}
                  className="flex-1 bg-white text-black text-sm font-medium py-2 rounded-lg disabled:opacity-40 hover:bg-white/90 transition-colors"
                >
                  {submitting ? "Creating…" : "Create & Add"}
                </button>
                <button
                  onClick={() => setCreating(false)}
                  className="px-3 py-2 text-white/50 text-sm hover:text-white/70 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full py-2.5 border border-dashed border-white/15 rounded-lg text-white/40 text-sm hover:border-white/25 hover:text-white/60 transition-colors mt-1"
            >
              + New Collection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
