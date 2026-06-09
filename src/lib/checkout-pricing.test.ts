import { describe, it, expect } from "vitest";
import { priceLines, isPaidChargeValid, type PriceableFrame } from "./checkout-pricing";

const ACCRA = "b452d53e-4182-4dbe-be2b-ecc50234e977";
const ABURI = "c0000000-0000-4000-8000-000000000002";

const frames: PriceableFrame[] = [
  {
    id: ACCRA,
    name: "Accra",
    slug: "accra",
    price_ghs: 58000,
    stock: 20,
    colors: [{ name: "Midnight" }, { name: "Tortoise" }],
  },
  {
    id: ABURI,
    name: "Aburi",
    slug: "aburi",
    price_ghs: 72000,
    stock: 2,
    colors: [{ name: "Black" }],
  },
];

describe("priceLines", () => {
  it("prices from the DB frame, never the client", () => {
    const result = priceLines(
      [{ frameId: ACCRA, colorName: "Midnight", qty: 2 }],
      frames,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.totalPesewa).toBe(116000);
      expect(result.lines[0].unitPricePesewa).toBe(58000);
      expect(result.lines[0].lineTotalPesewa).toBe(116000);
    }
  });

  it("sums multiple lines", () => {
    const result = priceLines(
      [
        { frameId: ACCRA, colorName: "Midnight", qty: 1 },
        { frameId: ABURI, colorName: "Black", qty: 1 },
      ],
      frames,
    );
    expect(result.ok && result.totalPesewa).toBe(130000);
  });

  it("rejects an unknown / inactive frame", () => {
    const result = priceLines(
      [{ frameId: "00000000-0000-4000-8000-000000000000", colorName: "X", qty: 1 }],
      frames,
    );
    expect(result.ok).toBe(false);
  });

  it("rejects an unavailable colour", () => {
    const result = priceLines([{ frameId: ACCRA, colorName: "Neon", qty: 1 }], frames);
    expect(result.ok).toBe(false);
  });

  it("rejects quantity above stock", () => {
    const result = priceLines([{ frameId: ABURI, colorName: "Black", qty: 3 }], frames);
    expect(result.ok).toBe(false);
  });
});

describe("isPaidChargeValid", () => {
  it("accepts a matching successful GHS charge", () => {
    expect(
      isPaidChargeValid({ event: "charge.success", currency: "GHS", amountPesewa: 58000 }, 58000),
    ).toBe(true);
  });

  it("rejects an amount mismatch (anti-tamper)", () => {
    expect(
      isPaidChargeValid({ event: "charge.success", currency: "GHS", amountPesewa: 100 }, 58000),
    ).toBe(false);
  });

  it("rejects a non-GHS currency", () => {
    expect(
      isPaidChargeValid({ event: "charge.success", currency: "NGN", amountPesewa: 58000 }, 58000),
    ).toBe(false);
  });

  it("rejects a non-success event", () => {
    expect(
      isPaidChargeValid({ event: "charge.failed", currency: "GHS", amountPesewa: 58000 }, 58000),
    ).toBe(false);
  });
});
