/**
 * Customer-facing order tracker (US-P1-05 / dashboard). Maps the raw DB
 * `orders.status` to a 3-stage delivery timeline. Deliberately omits any
 * lens-fulfilment stage ("lenses cut") — that depends on the lens partner and
 * isn't modelled yet — and the in-transit "shipped" stage (a shipped order sits
 * at "confirmed"; its courier/tracking detail surfaces separately on the order
 * page). This timeline only reflects statuses we actually set.
 *
 * Pure + unit-tested; the presentational tracker consumes the result.
 */

export const TRACKER_STAGES = ["placed", "confirmed", "delivered"] as const;
export type TrackerStage = (typeof TRACKER_STAGES)[number];

export const TRACKER_STAGE_LABEL: Record<TrackerStage, string> = {
  placed: "Order placed",
  confirmed: "Confirmed",
  delivered: "Delivered",
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
    case "shipped":
      // No dedicated in-transit stage — a shipped order still reads as
      // "confirmed" on the timeline; courier/tracking shows separately.
      return 1; // confirmed
    case "delivered":
      return 2; // delivered
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

/** Build the 3-step timeline for an order status. */
export function buildTracker(status: string): TrackerStep[] {
  const idx = stageIndex(status);
  return TRACKER_STAGES.map((stage, i) => ({
    stage,
    label: TRACKER_STAGE_LABEL[stage],
    done: i <= idx,
    current: i === idx,
  }));
}
