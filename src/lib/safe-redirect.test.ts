import { describe, it, expect } from "vitest";
import { safeRedirect } from "@/lib/safe-redirect";

describe("safeRedirect", () => {
  it("allows relative paths", () => {
    expect(safeRedirect("/account")).toBe("/account");
  });

  it("rejects absolute URLs", () => {
    expect(safeRedirect("https://evil.com")).toBe("/");
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeRedirect("//evil.com")).toBe("/");
  });

  it("rejects javascript: scheme", () => {
    expect(safeRedirect("javascript:alert(1)")).toBe("/");
  });

  it("falls back to the provided fallback when input is null", () => {
    expect(safeRedirect(null, "/shop")).toBe("/shop");
  });
});
