import { buildTracker } from "@/lib/order-tracker";

/**
 * Presentational delivery timeline for an order status. Pure render over
 * buildTracker() — done stages use the sage accent, the rest are hairline. The
 * column count tracks the number of modelled stages so it stays correct if the
 * stage list changes (e.g. a future "delivered" stage).
 */
export function OrderTracker({ status }: { status: string }) {
  const steps = buildTracker(status);

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map((step) => (
        <div key={step.stage}>
          <div
            className="mb-2 h-[3px] w-full rounded-full"
            style={{
              background: step.done ? "var(--lm-sage)" : "var(--lm-hair)",
            }}
          />
          <div
            className="text-xs font-semibold"
            style={{ color: step.done ? "var(--lm-text)" : "var(--lm-muted)" }}
          >
            {step.label}
          </div>
        </div>
      ))}
    </div>
  );
}
