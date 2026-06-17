/**
 * Customer-facing order tracker (US-P1-05 / dashboard). Maps the raw DB
 * `orders.status` to a delivery timeline. Deliberately omits any lens-fulfilment
 * stage ("lenses cut") — that depends on the lens partner and isn't modelled yet.
 *
 * Only models stages that something in the system can actually *set*: `placed`
 * (order created), `confirmed` (Paystack webhook → paid / cod_collected), and
 * `shipped` (admin "Mark as shipped"). A `delivered` stage was intentionally
 * dropped: nothing sets `status='delivered'` in v1 (no admin action, no courier
 * integration), so showing it would be fiction. Re-add it here when a real
 * delivery-confirmation mechanism exists.
 *
 * Pure + unit-tested; the presentational tracker consumes the result.
 */

export const TRACKER_STAGES = ["placed", "confirmed", "shipped"] as const;
export type TrackerStage = (typeof TRACKER_STAGES)[number];

export const TRACKER_STAGE_LABEL: Record<TrackerStage, string> = {
  placed: "Order placed",
  confirmed: "Confirmed",
  shipped: "On its way",
};

/**
 * Statuses that mean an order is no longer "live" (nothing to track). A live
 * order is the most recent order whose status is NOT one of these.
 */
const FINAL_STATUSES = new Set([
  "delivered",
  "failed",
  "failed_timeout",
  "refunded",
]);

/** True if an order is still in flight (worth showing on the tracker). */
export function isLiveOrder(status: string): boolean {
  return !FINAL_STATUSES.has(status);
}

/** How far along the timeline a status sits (index into TRACKER_STAGES). */
function stageIndex(status: string): number {
  switch (status) {
    case "pending":
    case "cod_pending":
      return 0; // placed
    case "paid":
    case "cod_collected":
      return 1; // confirmed
    case "shipped":
      return 2; // on its way
    case "delivered":
      // Not settable in v1, but stay defensive: cap at the last modelled stage
      // rather than overflowing the timeline.
      return 2;
    default:
      // failed / refunded / unknown — show only the first stage as reached.
      return 0;
  }
}

export type TrackerStep = {
  stage: TrackerStage;
  label: string;
  /** Reached (this stage or an earlier one is the current position). */
  done: boolean;
  /** The order's current position on the timeline. */
  current: boolean;
};

/** Build the timeline steps for an order status. */
export function buildTracker(status: string): TrackerStep[] {
  const idx = stageIndex(status);
  return TRACKER_STAGES.map((stage, i) => ({
    stage,
    label: TRACKER_STAGE_LABEL[stage],
    done: i <= idx,
    current: i === idx,
  }));
}
