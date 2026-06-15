/**
 * Customer-facing prescription-status pill (US-P1-03). Presentational, server-safe.
 * Mirrors OrderStatusPill's tone styling with the portal's --lm-* tokens.
 */
type Tone = "sage" | "blue" | "warm";

const STATUS_META: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "Awaiting review", tone: "blue" },
  verified: { label: "Verified", tone: "sage" },
  rejected: { label: "Not accepted", tone: "warm" },
};

const TONE_STYLE: Record<Tone, React.CSSProperties> = {
  sage: {
    background: "color-mix(in srgb, var(--lm-sage) 15%, transparent)",
    color: "var(--lm-sage)",
  },
  blue: {
    background: "color-mix(in srgb, var(--lm-blue) 15%, transparent)",
    color: "var(--lm-blue)",
  },
  warm: {
    background: "color-mix(in srgb, var(--lm-warm) 15%, transparent)",
    color: "var(--lm-warm)",
  },
};

export function PrescriptionStatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, tone: "blue" as const };
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={TONE_STYLE[meta.tone]}
    >
      {meta.label}
    </span>
  );
}
