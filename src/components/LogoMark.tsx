interface LogoMarkProps {
  size?: number;
  color?: string;
  glowColor?: string;
  showGlow?: boolean;
}

export function LogoMark({
  size = 36,
  color = "#89CFF0",
  glowColor = "rgba(137,207,240,0.4)",
  showGlow = true,
}: LogoMarkProps) {
  const h = Math.round(size * 1.2); // viewBox ratio 100:120
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 100 120"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: "block",
        filter: showGlow
          ? `drop-shadow(0 0 ${Math.max(3, Math.round(size / 9))}px ${glowColor})`
          : undefined,
      }}
    >
      {/*
        Outer: upward-pointing arrow mark
        Inner (M50 25…): diamond cutout → creates negative space via evenodd
      */}
      <path
        fill={color}
        fillRule="evenodd"
        d="
          M50 5
          L90 75
          L75 75
          L65 58
          L58 70
          L68 70
          L60 85
          L50 85
          L40 85
          L32 70
          L42 70
          L35 58
          L25 75
          L10 75
          Z
          M50 25 L38 48 L50 42 L62 48 Z
        "
      />
    </svg>
  );
}
