/**
 * Customer-facing order-status display (US-P0-08). Maps the DB `orders.status`
 * enum to plain-language wording + a brand-token tone. Pure (unit-tested); the
 * tone → CSS class lookup lives in the presentational pill so this stays
 * framework-free. The admin surface keeps its own raw-status `StatusBadge` —
 * customers should never see "cod_pending".
 */
export type OrderStatusTone = "sage" | "blue" | "warm" | "neutral";

export type OrderStatusDisplay = {
  label: string;
  tone: OrderStatusTone;
};

const STATUS_DISPLAY: Record<string, OrderStatusDisplay> = {
  pending: { label: "Awaiting payment", tone: "neutral" },
  paid: { label: "Confirmed", tone: "blue" },
  cod_pending: { label: "Pay on delivery", tone: "warm" },
  cod_collected: { label: "Payment collected", tone: "blue" },
  shipped: { label: "On its way", tone: "blue" },
  delivered: { label: "Delivered", tone: "sage" },
  failed: { label: "Payment failed", tone: "warm" },
  failed_timeout: { label: "Payment timed out", tone: "warm" },
  refunded: { label: "Refunded", tone: "neutral" },
};

/** Friendly label + tone for an order status. Unknown values fall back to a neutral "Processing". */
export function orderStatusDisplay(status: string): OrderStatusDisplay {
  return STATUS_DISPLAY[status] ?? { label: "Processing", tone: "neutral" };
}
