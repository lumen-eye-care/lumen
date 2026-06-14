import { describe, it, expect } from "vitest";
import {
  buildTracker,
  isLiveOrder,
  TRACKER_STAGES,
} from "./order-tracker";

describe("isLiveOrder", () => {
  it("treats in-flight statuses as live", () => {
    for (const s of ["pending", "cod_pending", "paid", "cod_collected", "shipped"]) {
      expect(isLiveOrder(s)).toBe(true);
    }
  });

  it("treats final statuses as not live", () => {
    for (const s of ["delivered", "failed", "failed_timeout", "refunded"]) {
      expect(isLiveOrder(s)).toBe(false);
    }
  });
});

describe("buildTracker", () => {
  it("always returns the four stages in order", () => {
    const steps = buildTracker("pending");
    expect(steps.map((s) => s.stage)).toEqual([...TRACKER_STAGES]);
  });

  it("marks only 'placed' as current for a pending order", () => {
    const steps = buildTracker("pending");
    expect(steps[0]).toMatchObject({ stage: "placed", done: true, current: true });
    expect(steps[1].done).toBe(false);
    expect(steps[3].done).toBe(false);
  });

  it("marks placed+confirmed done for a paid order, current at confirmed", () => {
    const steps = buildTracker("paid");
    expect(steps[0].done).toBe(true);
    expect(steps[1]).toMatchObject({ stage: "confirmed", done: true, current: true });
    expect(steps[2].done).toBe(false);
  });

  it("treats cod_collected like confirmed", () => {
    expect(buildTracker("cod_collected")[1].current).toBe(true);
  });

  it("advances to shipped", () => {
    const steps = buildTracker("shipped");
    expect(steps[2]).toMatchObject({ stage: "shipped", done: true, current: true });
    expect(steps[3].done).toBe(false);
  });

  it("completes all stages when delivered", () => {
    const steps = buildTracker("delivered");
    expect(steps.every((s) => s.done)).toBe(true);
    expect(steps[3].current).toBe(true);
  });
});
