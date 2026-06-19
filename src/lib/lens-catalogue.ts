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
  /** Builder bucket: 'coating' | 'sun' | 'thickness'. */
  group: string;
  /** When true, at most one add-on from this group may be selected (e.g. lens index). */
  singleSelect: boolean;
};

export type LensCatalogueView = {
  lensTypes: LensTypeView[];
  addons: LensAddonView[];
};

/**
 * Quiz → builder handoff. The /lens-guide quiz writes the recommended slugs here;
 * the PDP builder reads them on mount to prefill. Versioned key; slugs only (no
 * prices, no PII).
 */
export const LENS_QUIZ_STORAGE_KEY = "lumen.lensquiz.v1";

export type LensQuizHandoff = {
  lensTypeSlug: string | null;
  addonSlugs: string[];
};

/** Defensively parse a stored handoff; anything malformed → null. */
export function parseLensQuizHandoff(raw: string | null): LensQuizHandoff | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    const lensTypeSlug = typeof o.lensTypeSlug === "string" ? o.lensTypeSlug : null;
    const addonSlugs = Array.isArray(o.addonSlugs)
      ? o.addonSlugs.filter((s): s is string => typeof s === "string")
      : [];
    if (!lensTypeSlug && addonSlugs.length === 0) return null;
    return { lensTypeSlug, addonSlugs };
  } catch {
    return null;
  }
}

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
