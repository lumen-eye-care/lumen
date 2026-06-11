import { describe, expect, it } from "vitest";
import { firstForwardedIp, rateLimitKey, secondsUntil } from "./rate-limit";

describe("rateLimitKey", () => {
  it("is deterministic for the same parts", () => {
    expect(rateLimitKey("1.2.3.4", "a@b.com")).toBe(
      rateLimitKey("1.2.3.4", "a@b.com"),
    );
  });

  it("normalises case and whitespace (same email, same key)", () => {
    expect(rateLimitKey("1.2.3.4", "  A@B.com ")).toBe(
      rateLimitKey("1.2.3.4", "a@b.com"),
    );
  });

  it("differs across parts (different email, different key)", () => {
    expect(rateLimitKey("1.2.3.4", "a@b.com")).not.toBe(
      rateLimitKey("1.2.3.4", "c@d.com"),
    );
  });

  it("never contains the raw input (PII stays out of Redis)", () => {
    const key = rateLimitKey("1.2.3.4", "customer@example.com");
    expect(key).not.toContain("customer");
    expect(key).not.toContain("1.2.3.4");
    expect(key).toMatch(/^[0-9a-f]{32}$/);
  });

  it("treats null/undefined parts as empty", () => {
    expect(rateLimitKey(null, "a@b.com")).toBe(rateLimitKey("", "a@b.com"));
    expect(rateLimitKey(undefined)).toBe(rateLimitKey(""));
  });
});

describe("secondsUntil", () => {
  it("rounds up partial seconds", () => {
    expect(secondsUntil(10_500, 10_000)).toBe(1);
    expect(secondsUntil(11_001, 10_000)).toBe(2);
  });

  it("floors at 1 second even when the reset has passed", () => {
    expect(secondsUntil(9_000, 10_000)).toBe(1);
    expect(secondsUntil(10_000, 10_000)).toBe(1);
  });
});

describe("firstForwardedIp", () => {
  it("takes the first entry of a multi-hop header", () => {
    expect(firstForwardedIp("203.0.113.7, 70.41.3.18, 150.172.238.178")).toBe(
      "203.0.113.7",
    );
  });

  it("trims a single value", () => {
    expect(firstForwardedIp(" 203.0.113.7 ")).toBe("203.0.113.7");
  });

  it("falls back to 'unknown' for missing or empty headers", () => {
    expect(firstForwardedIp(null)).toBe("unknown");
    expect(firstForwardedIp("")).toBe("unknown");
    expect(firstForwardedIp(" , 1.2.3.4")).toBe("unknown");
  });
});
