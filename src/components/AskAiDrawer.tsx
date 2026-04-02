"use client";

import { useState, useRef } from "react";
import { useSession, signIn } from "next-auth/react";

interface AskAiDrawerProps {
  cardId: string;
  headline: string;
  onClose: () => void;
}

interface QA {
  question: string;
  answer: string;
}

export function AskAiDrawer({ cardId, headline, onClose }: AskAiDrawerProps) {
  const { data: session } = useSession();
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<QA[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ask = async () => {
    if (!session || !question.trim() || loading) return;
    const q = question.trim();
    setQuestion("");
    setLoading(true);
    try {
      const res = await fetch(`/api/cards/${cardId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setHistory((prev) => [...prev, { question: q, answer: data.answer ?? "No answer received." }]);
    } catch {
      setHistory((prev) => [...prev, { question: q, answer: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 fade-in" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 drawer-enter bg-[#0d0d1a] border-t border-indigo-500/20 rounded-t-2xl max-h-[80dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
                <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-sm">Ask AI about this paper</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Context */}
        <div className="px-5 pb-3 shrink-0">
          <p className="text-indigo-300/60 text-xs italic truncate">&ldquo;{headline}&rdquo;</p>
        </div>

        {/* Q&A history */}
        <div className="flex-1 overflow-y-auto px-5 pb-2 min-h-0 space-y-4">
          {history.length === 0 && !loading && (
            <div className="py-6 text-center">
              <p className="text-white/40 text-sm">Ask anything about this paper.</p>
              <p className="text-white/25 text-xs mt-1">
                Claude will explain it in plain English.
              </p>
            </div>
          )}
          {history.map((qa, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-indigo-500/20 rounded-2xl rounded-tr-md px-4 py-2.5">
                  <p className="text-white/90 text-sm">{qa.question}</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[90%] bg-white/6 rounded-2xl rounded-tl-md px-4 py-2.5">
                  <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{qa.answer}</p>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/6 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-white/8 px-4 py-3 pb-safe">
          {session ? (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What does this paper prove?"
                maxLength={500}
                className="flex-1 bg-white/8 border border-indigo-500/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                onKeyDown={(e) => e.key === "Enter" && ask()}
              />
              <button
                onClick={ask}
                disabled={!question.trim() || loading}
                className="px-3 py-2 rounded-xl bg-indigo-500 text-white text-sm font-semibold disabled:opacity-40 hover:bg-indigo-400 transition-colors"
              >
                Ask
              </button>
            </div>
          ) : (
            <div className="text-center py-1">
              <button
                onClick={() => signIn()}
                className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
              >
                Sign in to ask questions →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
