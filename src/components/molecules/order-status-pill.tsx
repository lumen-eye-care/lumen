import { orderStatusDisplay, type OrderStatusTone } from "@/lib/order-status";

/**
 * Customer-facing order-status pill (US-P0-08). Presentational only — server-safe
 * (no hooks). Wording + tone come from the pure `orderStatusDisplay` helper.
 */
const TONE_CLASS: Record<OrderStatusTone, string> = {
  sage: "bg-lumen-sage/15 text-lumen-sage",
  blue: "bg-lumen-blue/12 text-lumen-blue",
  warm: "bg-lumen-warm/15 text-lumen-warm",
  neutral: "bg-lumen-ink/8 text-lumen-ink/70",
};

export function OrderStatusPill({ status }: { status: string }) {
  const { label, tone } = orderStatusDisplay(status);
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASS[tone]}`}
    >
      {label}
    </span>
  );
}
