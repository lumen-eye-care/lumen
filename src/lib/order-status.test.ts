import { describe, it, expect } from "vitest";
import { orderStatusDisplay } from "@/lib/order-status";

describe("orderStatusDisplay", () => {
  it("maps known statuses to friendly labels + tones", () => {
    expect(orderStatusDisplay("paid")).toEqual({ label: "Confirmed", tone: "blue" });
    expect(orderStatusDisplay("cod_pending")).toEqual({ label: "Pay on delivery", tone: "warm" });
    expect(orderStatusDisplay("shipped")).toEqual({ label: "On its way", tone: "blue" });
    expect(orderStatusDisplay("delivered")).toEqual({ label: "Delivered", tone: "sage" });
  });

  it("never leaks the raw enum value to customers", () => {
    for (const status of [
      "pending",
      "paid",
      "cod_pending",
      "cod_collected",
      "shipped",
      "delivered",
      "failed",
      "failed_timeout",
      "refunded",
    ]) {
      expect(orderStatusDisplay(status).label).not.toContain("_");
    }
  });

  it("falls back to neutral 'Processing' for unknown statuses", () => {
    expect(orderStatusDisplay("something_new")).toEqual({ label: "Processing", tone: "neutral" });
  });
});
