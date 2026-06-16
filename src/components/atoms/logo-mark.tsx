/**
 * Lumen logomark — a glasses frame.
 *
 * Reworked away from the old eye-in-a-ring (which read as an "all-seeing eye"):
 * a clean two-lens frame with a bridge and temple flicks. Reads unmistakably as
 * eyewear, never as a staring eye. Wider than tall — `size` is the height, width
 * scales proportionally. Monochrome stroke; works with `color="currentColor"`.
 */

const VB_W = 62;
const VB_H = 34;

type LogoMarkProps = {
  size?: number;
  color?: string;
};

export function LogoMark({ size = 30, color = "#0F4C81" }: LogoMarkProps) {
  const width = Math.round((size * VB_W) / VB_H);
  return (
    <svg
      width={width}
      height={size}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* lenses */}
      <circle cx="14" cy="18" r="11" />
      <circle cx="48" cy="18" r="11" />
      {/* bridge */}
      <path d="M25 16 Q31 12 37 16" />
      {/* temple flicks */}
      <path d="M6 11 L1.5 8" />
      <path d="M56 11 L60.5 8" />
    </svg>
  );
}
