/**
 * Pure checkout pricing + charge-validation logic (no I/O, no server-only), so it
 * is unit-testable. The server module (src/server/checkout.ts) loads frames from
 * the DB and delegates the actual maths here. Money is integer pesewa throughout.
 */

import type { CartLineInput } from "@/lib/checkout-schemas";

/** A priced add-on, captured for the order's lens_config breakdown. */
export type PricedAddon = { slug: string; name: string; pricePesewa: number };

/**
 * The resolved lens build for a line — written verbatim into order_items.lens_config
 * (jsonb) for display/audit. The numeric surcharge is also carried on the line as
 * lensUnitPricePesewa and persisted to order_items.lens_price_ghs.
 */
export type LensConfig = {
  lensTypeSlug: string;
  lensTypeName: string;
  lensTypePricePesewa: number;
  addons: PricedAddon[];
  rxMethod: string | null;
  prescriptionId: string | null;
};

/** A DB-priced line — the only prices we ever charge against. */
export type PricedLine = {
  frameId: string;
  name: string;
  slug: string;
  colorName: string;
  unitPricePesewa: number; // frame unit price only
  lensUnitPricePesewa: number; // lens surcharge per unit (type + add-ons); 0 if frame-only
  lensConfig: LensConfig | null;
  qty: number;
  lineTotalPesewa: number; // (frame + lens) × qty
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

/** Lens catalogue entries (subset of lens_types / lens_addons rows). */
export type PriceableLensType = { slug: string; name: string; price_ghs: number };
export type PriceableAddon = {
  slug: string;
  name: string;
  price_ghs: number;
  /** Builder bucket; used to enforce single-select groups at re-price. */
  group: string;
  single_select: boolean;
};
export type LensCatalogue = {
  lensTypes: PriceableLensType[];
  addons: PriceableAddon[];
};

const EMPTY_CATALOGUE: LensCatalogue = { lensTypes: [], addons: [] };

/**
 * Price the lens build on a line against the authoritative catalogue. Returns the
 * per-unit surcharge + the resolved config, or an error string if any requested
 * slug is unknown/inactive (stale cart or tamper). A line with no lens build
 * resolves to { lensUnitPricePesewa: 0, lensConfig: null }.
 */
function priceLens(
  lens: CartLineInput["lens"],
  catalogue: LensCatalogue,
): { ok: true; lensUnitPricePesewa: number; lensConfig: LensConfig | null } | { ok: false; error: string } {
  // No lens build (frame-only line) — nothing to price.
  if (!lens || !lens.lensTypeSlug) {
    return { ok: true, lensUnitPricePesewa: 0, lensConfig: null };
  }

  const lensType = catalogue.lensTypes.find((t) => t.slug === lens.lensTypeSlug);
  if (!lensType) {
    return { ok: false, error: "A lens option in your bag is no longer available." };
  }

  const addons: PricedAddon[] = [];
  const singleSelectGroupsSeen = new Set<string>();
  for (const slug of lens.addonSlugs ?? []) {
    const addon = catalogue.addons.find((a) => a.slug === slug);
    if (!addon) {
      return { ok: false, error: "A lens add-on in your bag is no longer available." };
    }
    // A single-select group (e.g. lens thickness/index) may contribute at most one
    // option — reject a stale/tampered line that picked two from the same group.
    if (addon.single_select) {
      if (singleSelectGroupsSeen.has(addon.group)) {
        return { ok: false, error: "Please choose only one lens-thickness option." };
      }
      singleSelectGroupsSeen.add(addon.group);
    }
    addons.push({ slug: addon.slug, name: addon.name, pricePesewa: addon.price_ghs });
  }

  const lensUnitPricePesewa =
    lensType.price_ghs + addons.reduce((sum, a) => sum + a.pricePesewa, 0);

  return {
    ok: true,
    lensUnitPricePesewa,
    lensConfig: {
      lensTypeSlug: lensType.slug,
      lensTypeName: lensType.name,
      lensTypePricePesewa: lensType.price_ghs,
      addons,
      rxMethod: lens.rxMethod ?? null,
      prescriptionId: lens.prescriptionId ?? null,
    },
  };
}

/**
 * Given requested lines and the authoritative frames + lens catalogue, derive every
 * price from the DB, validating existence, colour, stock, and lens slugs. Never reads
 * a client price. The lens catalogue defaults to empty so frame-only callers (and the
 * existing tests) can omit it.
 */
export function priceLines(
  lines: CartLineInput[],
  frames: PriceableFrame[],
  catalogue: LensCatalogue = EMPTY_CATALOGUE,
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

    const lens = priceLens(line.lens, catalogue);
    if (!lens.ok) return { ok: false, error: lens.error };

    const unitPricePesewa = frame.price_ghs;
    priced.push({
      frameId: frame.id,
      name: frame.name,
      slug: frame.slug,
      colorName: color.name,
      unitPricePesewa,
      lensUnitPricePesewa: lens.lensUnitPricePesewa,
      lensConfig: lens.lensConfig,
      qty: line.qty,
      lineTotalPesewa: (unitPricePesewa + lens.lensUnitPricePesewa) * line.qty,
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
