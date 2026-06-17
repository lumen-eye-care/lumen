/**
 * Lens catalogue view types + pure price helper, shared between the server loader
 * (src/server/lenses.ts) and the client builder (frame-purchase-panel). No server
 * imports here so the client can use it. Money is integer pesewa throughout.
 *
 * The client computes a *display* total from these; checkout always re-prices from
 * the DB (src/lib/checkout-pricing.ts) — these prices are never trusted as charged.
 */

export type LensTypeView = {
  slug: string;
  name: string;
  description: string | null;
  price_ghs: number;
  badge: string | null;
};

export type LensAddonView = {
  slug: string;
  name: string;
  description: string | null;
  price_ghs: number;
  included: boolean;
};

export type LensCatalogueView = {
  lensTypes: LensTypeView[];
  addons: LensAddonView[];
};

/** Per-unit lens surcharge for a chosen type + add-on slug set (display only). */
export function lensUnitPesewa(
  catalogue: LensCatalogueView,
  lensTypeSlug: string | null,
  addonSlugs: Iterable<string>,
): number {
  const type = lensTypeSlug
    ? catalogue.lensTypes.find((t) => t.slug === lensTypeSlug)
    : undefined;
  let total = type?.price_ghs ?? 0;
  const set = new Set(addonSlugs);
  for (const addon of catalogue.addons) {
    if (set.has(addon.slug)) total += addon.price_ghs;
  }
  return total;
}
