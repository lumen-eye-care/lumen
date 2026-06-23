import { describe, it, expect } from "vitest";
import { newsletterSchema, normalizeEmail } from "@/lib/newsletter-schemas";

describe("newsletterSchema", () => {
  it("accepts a valid email and trims it", () => {
    const parsed = newsletterSchema.safeParse({ email: "  ama@example.com " });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBe("ama@example.com");
  });

  it("rejects an empty email", () => {
    const parsed = newsletterSchema.safeParse({ email: "" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.email?.[0]).toBe(
        "Enter your email address.",
      );
    }
  });

  it("rejects a malformed email", () => {
    const parsed = newsletterSchema.safeParse({ email: "not-an-email" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.email?.[0]).toBe(
        "Enter a valid email address.",
      );
    }
  });

  it("rejects an over-long email", () => {
    const parsed = newsletterSchema.safeParse({
      email: `${"a".repeat(250)}@example.com`,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("normalizeEmail", () => {
  it("lowercases and trims for case-insensitive dedup", () => {
    expect(normalizeEmail("  AMA@Example.COM ")).toBe("ama@example.com");
  });
});
