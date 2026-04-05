"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import type { Comment } from "@/types";
import { TierBadge } from "@/components/TierBadge";

interface CommentsDrawerProps {
  cardId: string;
  onClose: () => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

interface CommentRowProps {
  comment: Comment;
  onReply: (parentId: string, authorName: string) => void;
  depth?: number;
}

function CommentRow({ comment, onReply, depth = 0 }: CommentRowProps) {
  return (
    <div className={depth > 0 ? "pl-8 mt-2" : "mt-4"}>
      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-xs shrink-0 mt-0.5">
          {comment.authorImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={comment.authorImage}
              alt=""
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <span>{(comment.authorName ?? "?").charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-white/80 text-xs font-semibold">
              {comment.authorName ?? "Anonymous"}
            </span>
            <TierBadge tier={comment.authorTier} />
            <span className="text-white/30 text-xs">{timeAgo(comment.createdAt ?? "")}</span>
          </div>
          <p className="text-white/70 text-sm leading-relaxed">{comment.body}</p>
          {depth === 0 && (
            <button
              onClick={() => onReply(comment.id, comment.authorName ?? "them")}
              className="text-white/35 text-xs mt-1 hover:text-white/60 transition-colors"
            >
              Reply
            </button>
          )}
        </div>
      </div>
      {comment.replies?.map((reply) => (
        <CommentRow key={reply.id} comment={reply} onReply={onReply} depth={1} />
      ))}
    </div>
  );
}

export function CommentsDrawer({ cardId, onClose }: CommentsDrawerProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/cards/${cardId}/comments`)
      .then((r) => r.json())
      .then((data) => setComments(data.comments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cardId]);

  const handleReply = (parentId: string, authorName: string) => {
    setReplyTo({ id: parentId, name: authorName });
    inputRef.current?.focus();
  };

  const submit = async () => {
    if (!session || !text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/cards/${cardId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text.trim(), parentId: replyTo?.id ?? null }),
      });
      if (res.ok) {
        const { comment } = await res.json();
        if (replyTo) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyTo.id
                ? { ...c, replies: [...(c.replies ?? []), comment] }
                : c
            )
          );
        } else {
          setComments((prev) => [{ ...comment, replies: [] }, ...prev]);
        }
        setText("");
        setReplyTo(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/60 fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 drawer-enter bg-[#111111] border-t border-white/10 rounded-t-2xl max-h-[75dvh] flex flex-col">
        {/* Handle */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto absolute left-1/2 -translate-x-1/2" />
          <span className="text-white font-semibold text-sm">
            Comments{comments.length > 0 ? ` (${comments.length})` : ""}
          </span>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-5 pb-2 min-h-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">No comments yet. Be first!</p>
          ) : (
            comments.map((c) => (
              <CommentRow key={c.id} comment={c} onReply={handleReply} />
            ))
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-white/8 px-4 py-3 pb-safe">
          {replyTo && (
            <div className="flex items-center justify-between mb-2 text-xs text-white/40">
              <span>Replying to {replyTo.name}</span>
              <button onClick={() => setReplyTo(null)} className="hover:text-white/70">✕</button>
            </div>
          )}
          {session ? (
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a comment…"
                rows={1}
                maxLength={1000}
                className="flex-1 bg-white/8 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:ring-1 focus:ring-white/25"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
              />
              <button
                onClick={submit}
                disabled={!text.trim() || submitting}
                className="px-3 py-2 rounded-xl bg-white text-black text-sm font-semibold disabled:opacity-40 hover:bg-white/90 transition-colors"
              >
                Post
              </button>
            </div>
          ) : (
            <p className="text-white/40 text-sm text-center py-1">Sign in to comment</p>
          )}
        </div>
      </div>
    </>
  );
}
