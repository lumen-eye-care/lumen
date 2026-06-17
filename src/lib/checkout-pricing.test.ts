import { describe, it, expect } from "vitest";
import {
  priceLines,
  isPaidChargeValid,
  type PriceableFrame,
  type LensCatalogue,
} from "./checkout-pricing";

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

const catalogue: LensCatalogue = {
  lensTypes: [
    { slug: "single", name: "Single vision", price_ghs: 0 },
    { slug: "varifocal", name: "Varifocal", price_ghs: 48000 },
  ],
  addons: [
    { slug: "antireflective", name: "Anti-reflective coating", price_ghs: 0 },
    { slug: "transition", name: "Transitions® light-reactive", price_ghs: 32000 },
  ],
};

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

describe("priceLines — lens build", () => {
  it("adds the lens type + add-on surcharge to the line total", () => {
    const result = priceLines(
      [
        {
          frameId: ACCRA,
          colorName: "Midnight",
          qty: 2,
          lens: {
            lensTypeSlug: "varifocal",
            addonSlugs: ["antireflective", "transition"],
            rxMethod: "later",
          },
        },
      ],
      frames,
      catalogue,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      const line = result.lines[0];
      expect(line.unitPricePesewa).toBe(58000); // frame only
      expect(line.lensUnitPricePesewa).toBe(80000); // 48000 varifocal + 0 AR + 32000 transition
      expect(line.lineTotalPesewa).toBe((58000 + 80000) * 2);
      expect(result.totalPesewa).toBe(276000);
      expect(line.lensConfig?.lensTypeName).toBe("Varifocal");
      expect(line.lensConfig?.addons.map((a) => a.slug)).toEqual([
        "antireflective",
        "transition",
      ]);
      expect(line.lensConfig?.rxMethod).toBe("later");
    }
  });

  it("treats included (price 0) options as no surcharge", () => {
    const result = priceLines(
      [
        {
          frameId: ACCRA,
          colorName: "Midnight",
          qty: 1,
          lens: { lensTypeSlug: "single", addonSlugs: ["antireflective"] },
        },
      ],
      frames,
      catalogue,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lines[0].lensUnitPricePesewa).toBe(0);
      expect(result.totalPesewa).toBe(58000);
    }
  });

  it("carries prescriptionId into the lens config", () => {
    const rxId = "11111111-1111-4111-8111-111111111111";
    const result = priceLines(
      [
        {
          frameId: ACCRA,
          colorName: "Midnight",
          qty: 1,
          lens: { lensTypeSlug: "single", addonSlugs: [], rxMethod: "onfile", prescriptionId: rxId },
        },
      ],
      frames,
      catalogue,
    );
    expect(result.ok && result.lines[0].lensConfig?.prescriptionId).toBe(rxId);
  });

  it("rejects an unknown lens type (stale cart / tamper)", () => {
    const result = priceLines(
      [{ frameId: ACCRA, colorName: "Midnight", qty: 1, lens: { lensTypeSlug: "ghost", addonSlugs: [] } }],
      frames,
      catalogue,
    );
    expect(result.ok).toBe(false);
  });

  it("rejects an unknown add-on", () => {
    const result = priceLines(
      [
        {
          frameId: ACCRA,
          colorName: "Midnight",
          qty: 1,
          lens: { lensTypeSlug: "single", addonSlugs: ["ghost"] },
        },
      ],
      frames,
      catalogue,
    );
    expect(result.ok).toBe(false);
  });

  it("prices a frame-only line (no lens) as before", () => {
    const result = priceLines([{ frameId: ACCRA, colorName: "Midnight", qty: 1 }], frames, catalogue);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lines[0].lensUnitPricePesewa).toBe(0);
      expect(result.lines[0].lensConfig).toBeNull();
    }
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
