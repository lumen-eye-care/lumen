import { buildTracker } from "@/lib/order-tracker";

/**
 * Presentational 4-step delivery timeline for an order status. Pure render over
 * buildTracker() — done stages use the sage accent, the rest are hairline.
 */
export function OrderTracker({ status }: { status: string }) {
  const steps = buildTracker(status);

  return (
    <div className="grid grid-cols-4 gap-2">
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
