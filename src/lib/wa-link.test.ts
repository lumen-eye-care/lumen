import { describe, it, expect } from "vitest";
import { waMeUrl } from "@/lib/wa-link";

describe("waMeUrl", () => {
  it("strips the + and builds a bare link", () => {
    expect(waMeUrl("+233552138821")).toBe("https://wa.me/233552138821");
  });

  it("URL-encodes the prefilled message", () => {
    expect(waMeUrl("+233552138821", "Hi! I'd like to book.")).toBe(
      "https://wa.me/233552138821?text=Hi!%20I'd%20like%20to%20book.",
    );
  });
});
