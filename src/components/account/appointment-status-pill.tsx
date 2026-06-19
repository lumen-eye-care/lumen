/**
 * Customer-facing appointment-status pill (US-P1-01 customer view). Presentational,
 * server-safe. Mirrors PrescriptionStatusPill's tone styling with --lm-* tokens.
 * Statuses come from APPOINTMENT_STATUSES (requested/confirmed/cancelled/completed).
 */
type Tone = "sage" | "blue" | "warm" | "neutral";

const STATUS_META: Record<string, { label: string; tone: Tone }> = {
  requested: { label: "Requested", tone: "blue" },
  confirmed: { label: "Confirmed", tone: "sage" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "warm" },
};

const TONE_STYLE: Record<Tone, React.CSSProperties> = {
  sage: {
    background: "color-mix(in srgb, var(--lm-sage) 15%, transparent)",
    color: "var(--lm-sage-text)",
  },
  blue: {
    background: "color-mix(in srgb, var(--lm-blue) 15%, transparent)",
    color: "var(--lm-blue)",
  },
  warm: {
    background: "color-mix(in srgb, var(--lm-warm) 15%, transparent)",
    color: "var(--lm-warm-text)",
  },
  neutral: {
    background: "var(--lm-tint)",
    color: "var(--lm-muted)",
  },
};

export function AppointmentStatusPill({ status }: { status: string }) {
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
