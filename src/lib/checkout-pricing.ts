/**
 * Pure checkout pricing + charge-validation logic (no I/O, no server-only), so it
 * is unit-testable. The server module (src/server/checkout.ts) loads frames from
 * the DB and delegates the actual maths here. Money is integer pesewa throughout.
 */

import type { CartLineInput } from "@/lib/checkout-schemas";

/** A DB-priced line — the only prices we ever charge against. */
export type PricedLine = {
  frameId: string;
  name: string;
  slug: string;
  colorName: string;
  unitPricePesewa: number;
  qty: number;
  lineTotalPesewa: number;
};

export type RepriceOk = { ok: true; lines: PricedLine[]; totalPesewa: number };
export type RepriceError = { ok: false; error: string };
export type RepriceResult = RepriceOk | RepriceError;

/** Minimal frame shape needed to price a line (subset of the DB row). */
export type PriceableFrame = {
  id: string;
  name: string;
  slug: string;
  price_ghs: number; // integer pesewa
  stock: number;
  colors: { name: string }[];
};

/**
 * Given requested lines and the authoritative frames, derive every price from the
 * frame, validating existence, colour, and stock. Never reads a client price.
 */
export function priceLines(
  lines: CartLineInput[],
  frames: PriceableFrame[],
): RepriceResult {
  const byId = new Map(frames.map((f) => [f.id, f]));
  const priced: PricedLine[] = [];

  for (const line of lines) {
    const frame = byId.get(line.frameId);
    // Unknown id, or RLS hid it (inactive) — either way it's not buyable.
    if (!frame) return { ok: false, error: "An item in your bag is no longer available." };

    const color = frame.colors.find((c) => c.name === line.colorName);
    if (!color) return { ok: false, error: `"${frame.name}" is unavailable in that colour.` };

    if (line.qty > frame.stock) {
      return {
        ok: false,
        error:
          frame.stock > 0
            ? `Only ${frame.stock} of "${frame.name}" left in stock.`
            : `"${frame.name}" is out of stock.`,
      };
    }

    const unitPricePesewa = frame.price_ghs;
    priced.push({
      frameId: frame.id,
      name: frame.name,
      slug: frame.slug,
      colorName: color.name,
      unitPricePesewa,
      qty: line.qty,
      lineTotalPesewa: unitPricePesewa * line.qty,
    });
  }

  const totalPesewa = priced.reduce((sum, l) => sum + l.lineTotalPesewa, 0);
  return { ok: true, lines: priced, totalPesewa };
}

/**
 * Whether a Paystack charge event should fulfil an order: a successful charge in
 * GHS whose amount (pesewa) exactly matches the order total. Verifying the amount
 * is the anti-tamper check — never deliver value on a mismatch.
 */
export function isPaidChargeValid(
  charge: { event: string; currency: string; amountPesewa: number },
  orderTotalPesewa: number,
): boolean {
  return (
    charge.event === "charge.success" &&
    charge.currency === "GHS" &&
    Number.isInteger(charge.amountPesewa) &&
    charge.amountPesewa === orderTotalPesewa
  );
}
