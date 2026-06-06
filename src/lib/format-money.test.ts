import { describe, it, expect } from "vitest";
import { formatGhs } from "@/lib/format-money";

describe("formatGhs", () => {
  it("formats integer pesewa as GHS", () => {
    expect(formatGhs(125000)).toMatch(/1,250\.00/);
  });

  it("formats zero", () => {
    expect(formatGhs(0)).toMatch(/0\.00/);
  });

  it("rejects non-integer pesewa", () => {
    expect(() => formatGhs(1250.5)).toThrow(TypeError);
  });
});
