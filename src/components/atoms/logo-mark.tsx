/**
 * Lumen logomark — ported from docs/design/shared.jsx.
 * SVG-only; no image file dependency.
 */

type LogoMarkProps = {
  size?: number;
  color?: string;
};

export function LogoMark({ size = 30, color = "#0F4C81" }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="18.5" stroke={color} strokeWidth="1.5" />
      <path
        d="M6 20 Q20 8 34 20 Q20 32 6 20Z"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="20" cy="20" r="4.5" fill={color} />
      <circle cx="21.5" cy="18.5" r="1.4" fill="#fff" />
    </svg>
  );
}
