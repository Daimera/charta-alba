"use client";

interface StarRatingProps {
  value: number | null;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export function StarRating({ value, onChange, disabled }: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => !disabled && onChange(star)}
          disabled={disabled}
          className="transition-transform hover:scale-110 active:scale-95 disabled:cursor-default"
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={value !== null && star <= value ? "#facc15" : "none"}
            stroke={value !== null && star <= value ? "#facc15" : "rgba(255,255,255,0.3)"}
            strokeWidth="1.5"
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        </button>
      ))}
    </div>
  );
}
