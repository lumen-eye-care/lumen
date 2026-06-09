import { describe, it, expect } from "vitest";
import {
  normalizeGhanaPhone,
  deliverySchema,
  checkoutSchema,
} from "./checkout-schemas";

const FRAME_ID = "b452d53e-4182-4dbe-be2b-ecc50234e977";

const validDelivery = {
  name: "Ama Mensah",
  phone: "0241234567",
  city: "Accra",
  address: "12 Cantonments Road, Osu",
  landmark: "",
};

describe("normalizeGhanaPhone", () => {
  it("normalises a local 0XX number to E.164", () => {
    expect(normalizeGhanaPhone("0241234567")).toBe("+233241234567");
  });

  it("accepts an already-E.164 +233 number", () => {
    expect(normalizeGhanaPhone("+233241234567")).toBe("+233241234567");
  });

  it("rejects a non-Ghana number", () => {
    expect(normalizeGhanaPhone("+14155552671")).toBeNull();
  });

  it("rejects gibberish", () => {
    expect(normalizeGhanaPhone("not a phone")).toBeNull();
  });
});

describe("deliverySchema", () => {
  it("accepts valid details and normalises the phone", () => {
    const parsed = deliverySchema.safeParse(validDelivery);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.phone).toBe("+233241234567");
  });

  it("rejects an invalid phone", () => {
    const parsed = deliverySchema.safeParse({ ...validDelivery, phone: "12345" });
    expect(parsed.success).toBe(false);
  });

  it("requires name, city and address", () => {
    expect(deliverySchema.safeParse({ ...validDelivery, name: "" }).success).toBe(false);
    expect(deliverySchema.safeParse({ ...validDelivery, city: "" }).success).toBe(false);
    expect(deliverySchema.safeParse({ ...validDelivery, address: "" }).success).toBe(false);
  });
});

describe("checkoutSchema", () => {
  const validLines = [{ frameId: FRAME_ID, colorName: "Midnight", qty: 1 }];

  it("accepts a valid momo checkout", () => {
    const parsed = checkoutSchema.safeParse({
      delivery: validDelivery,
      method: "momo",
      lines: validLines,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an unknown payment method", () => {
    const parsed = checkoutSchema.safeParse({
      delivery: validDelivery,
      method: "bitcoin",
      lines: validLines,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an empty bag", () => {
    const parsed = checkoutSchema.safeParse({
      delivery: validDelivery,
      method: "cod",
      lines: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a non-uuid frame id", () => {
    const parsed = checkoutSchema.safeParse({
      delivery: validDelivery,
      method: "card",
      lines: [{ frameId: "nope", colorName: "Midnight", qty: 1 }],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a zero / negative quantity", () => {
    const parsed = checkoutSchema.safeParse({
      delivery: validDelivery,
      method: "card",
      lines: [{ frameId: FRAME_ID, colorName: "Midnight", qty: 0 }],
    });
    expect(parsed.success).toBe(false);
  });
});
