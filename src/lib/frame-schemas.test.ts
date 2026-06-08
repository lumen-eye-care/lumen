import { describe, it, expect } from "vitest";
import { frameSchema, markShippedSchema } from "./frame-schemas";

const valid = {
  name: "Accra",
  slug: "accra",
  price_ghs: 58000,
  stock: 20,
  category_id: "11111111-1111-4111-8111-111111111111",
  description: "Italian acetate round frame.",
  shape: "round" as const,
  gender: "men" as const,
  material: "Italian Acetate",
  badge: "BESTSELLER" as const,
  colors: [{ name: "Midnight", hex: "#1E3148" }],
  photo_urls: ["https://example.supabase.co/storage/v1/object/public/frames/accra/a.webp"],
};

describe("frameSchema", () => {
  it("accepts a fully-specified valid frame", () => {
    expect(frameSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts nullable optional fields", () => {
    const parsed = frameSchema.safeParse({
      ...valid,
      category_id: null,
      shape: null,
      gender: null,
      badge: null,
      description: "",
      material: "",
      colors: [],
      photo_urls: [],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects non-integer / non-positive price (pesewa)", () => {
    expect(frameSchema.safeParse({ ...valid, price_ghs: 580.5 }).success).toBe(false);
    expect(frameSchema.safeParse({ ...valid, price_ghs: 0 }).success).toBe(false);
  });

  it("rejects negative stock", () => {
    expect(frameSchema.safeParse({ ...valid, stock: -1 }).success).toBe(false);
  });

  it("rejects bad slugs", () => {
    for (const slug of ["with space", "trailing-", "-leading", "a--b", "café"]) {
      expect(frameSchema.safeParse({ ...valid, slug }).success).toBe(false);
    }
  });

  it("normalises uppercase slugs to lowercase", () => {
    const parsed = frameSchema.safeParse({ ...valid, slug: "Accra" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.slug).toBe("accra");
  });

  it("rejects malformed hex colours", () => {
    expect(
      frameSchema.safeParse({ ...valid, colors: [{ name: "X", hex: "1E3148" }] }).success,
    ).toBe(false);
    expect(
      frameSchema.safeParse({ ...valid, colors: [{ name: "X", hex: "#FFF" }] }).success,
    ).toBe(false);
  });

  it("rejects an out-of-set shape/gender/badge", () => {
    expect(frameSchema.safeParse({ ...valid, shape: "wayfarer" }).success).toBe(false);
    expect(frameSchema.safeParse({ ...valid, gender: "other" }).success).toBe(false);
    expect(frameSchema.safeParse({ ...valid, badge: "SALE" }).success).toBe(false);
  });
});

describe("markShippedSchema", () => {
  it("accepts a uuid", () => {
    expect(
      markShippedSchema.safeParse({ orderId: "11111111-1111-4111-8111-111111111111" })
        .success,
    ).toBe(true);
  });
  it("rejects a non-uuid", () => {
    expect(markShippedSchema.safeParse({ orderId: "nope" }).success).toBe(false);
  });
});
