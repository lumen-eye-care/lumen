import { LogoMark } from "./logo-mark";

/**
 * Stacked Lumen lockup — the glasses-frame mark centered above the letterspaced
 * "LUMEN" wordmark. This is the approved brand badge (concept "B"): use it where
 * the logo gets to be a centered emblem — Open Graph cards, splash, footer brand
 * block. The horizontal mark-beside-word lockup in the header is the compact
 * counterpart (see site-header.tsx).
 *
 * Monochrome: `color` drives both the mark stroke and the wordmark, so it adapts
 * to light/dark via `color="currentColor"`. The wordmark inherits the body font
 * (Geist); `size` is the mark height and the word scales from it.
 */

type LogoLockupProps = {
  /** Mark height in px; the wordmark scales proportionally. */
  size?: number;
  color?: string;
  /** Gap between mark and wordmark, px. */
  gap?: number;
  className?: string;
};

export function LogoLockup({
  size = 40,
  color = "currentColor",
  gap = 12,
  className,
}: LogoLockupProps) {
  const fontSize = Math.max(10, Math.round(size * 0.4));
  const letterSpacing = "0.42em";
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap,
        color,
      }}
    >
      <LogoMark size={size} color={color} />
      <span
        style={{
          fontSize,
          fontWeight: 500,
          lineHeight: 1,
          letterSpacing,
          // trailing letter-spacing pushes the word off-center; nudge it back.
          textIndent: letterSpacing,
        }}
      >
        LUMEN
      </span>
    </span>
  );
}
