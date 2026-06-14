import { orderStatusDisplay, type OrderStatusTone } from "@/lib/order-status";

/**
 * Customer-facing order-status pill (US-P0-08). Presentational only — server-safe
 * (no hooks). Wording + tone come from the pure `orderStatusDisplay` helper.
 */
const TONE_STYLE: Record<OrderStatusTone, React.CSSProperties> = {
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
  neutral: {
    background: "var(--lm-tint)",
    color: "var(--lm-muted)",
  },
};

export function OrderStatusPill({ status }: { status: string }) {
  const { label, tone } = orderStatusDisplay(status);
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={TONE_STYLE[tone]}
    >
      {label}
    </span>
  );
}
