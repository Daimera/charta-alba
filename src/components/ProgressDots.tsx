"use client";

interface ProgressDotsProps {
  total: number;
  current: number;
}

export function ProgressDots({ total, current }: ProgressDotsProps) {
  if (total <= 1) return null;

  const visible = Math.min(total, 9);
  const start = Math.max(0, Math.min(current - 4, total - visible));
  const dots = Array.from({ length: visible }, (_, i) => start + i);

  return (
    <div className="fixed right-2 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1.5 pointer-events-none">
      {dots.map((i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-200"
          style={{
            width: i === current ? 5 : 3,
            height: i === current ? 5 : 3,
            backgroundColor:
              i === current
                ? "rgba(255,255,255,0.9)"
                : "rgba(255,255,255,0.25)",
          }}
        />
      ))}
    </div>
  );
}
