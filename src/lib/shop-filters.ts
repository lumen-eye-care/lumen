/**
 * URL param contract + pure filter/sort logic for the /shop catalogue.
 *
 * Filter state lives entirely in the URL (searchParams); Server Components
 * read it to scope the Supabase query (by category) and then apply in-memory
 * faceting over the returned rows. This keeps filtering fast on the small
 * catalogue while remaining shareable, bookmarkable, and SEO-friendly.
 *
 * Price params are in GHS (user-facing); price_ghs in DB is integer pesewa.
 */

import { FRAME_SHAPES, FRAME_GENDERS } from "@/lib/frame-schemas";
import type { ShopFrame } from "@/server/frames";

// ─── Allowed values ───────────────────────────────────────────────────────────

export const SHOP_SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest first" },
  { value: "price-low", label: "Price: low → high" },
  { value: "price-high", label: "Price: high → low" },
] as const;

export type ShopSort = (typeof SHOP_SORT_OPTIONS)[number]["value"];

// Material filter IDs (derived from the `material` column via substring match)
export const MATERIAL_OPTIONS = [
  { id: "acetate", label: "Italian Acetate" },
  { id: "titanium", label: "Japanese Titanium" },
  { id: "metal", label: "Metal" },
] as const;

export type MaterialId = (typeof MATERIAL_OPTIONS)[number]["id"];

// Colour swatch names used across the seed catalogue
export const COLOUR_OPTIONS = [
  { name: "Midnight", hex: "#1E3148" },
  { name: "Tortoise", hex: "#8B4513" },
  { name: "Onyx", hex: "#2D2D2D" },
  { name: "Smoke", hex: "#5A6B7A" },
  { name: "Cocoa", hex: "#8B7355" },
  { name: "Garnet", hex: "#7B2C36" },
  { name: "Sand", hex: "#C0A878" },
  { name: "Walnut", hex: "#5C4033" },
] as const;

export type ColourName = (typeof COLOUR_OPTIONS)[number]["name"];

// ─── Parsed filter state ──────────────────────────────────────────────────────

export type ParsedShopParams = {
  cat: string; // category slug, default "optical"
  sort: ShopSort;
  shapes: string[]; // subset of FRAME_SHAPES
  genders: string[]; // subset of FRAME_GENDERS
  materials: MaterialId[]; // subset of MATERIAL_OPTIONS ids
  colours: string[]; // subset of COLOUR_OPTIONS names
  minGhs: number | null; // GHS (not pesewa)
  maxGhs: number | null;
};

/**
 * Parse + whitelist searchParams into a safe, typed filter state.
 * All unknown values are dropped; no user-controlled strings reach SQL.
 */
export function parseShopParams(
  searchParams: Record<string, string | string[] | undefined>,
): ParsedShopParams {
  const get = (key: string): string =>
    (Array.isArray(searchParams[key])
      ? searchParams[key][0]
      : searchParams[key]) ?? "";

  const getList = (key: string): string[] => {
    const raw = searchParams[key];
    if (!raw) return [];
    const joined = Array.isArray(raw) ? raw.join(",") : raw;
    return joined
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  };

  const catRaw = get("cat") || "optical";
  const cat = catRaw; // category slug; validated against DB data at query time

  const sortRaw = get("sort");
  const sort: ShopSort =
    SHOP_SORT_OPTIONS.some((o) => o.value === sortRaw)
      ? (sortRaw as ShopSort)
      : "featured";

  const shapes = getList("shape").filter((s) =>
    (FRAME_SHAPES as readonly string[]).includes(s),
  );

  const genders = getList("gender").filter((g) =>
    (FRAME_GENDERS as readonly string[]).includes(g),
  );

  const materials = getList("material").filter((m) =>
    MATERIAL_OPTIONS.some((o) => o.id === m),
  ) as MaterialId[];

  const allowedColours = new Set<string>(COLOUR_OPTIONS.map((c) => c.name));
  const colours = getList("colour").filter((c) => allowedColours.has(c));

  const minRaw = parseFloat(get("min"));
  const maxRaw = parseFloat(get("max"));
  const minGhs = Number.isFinite(minRaw) && minRaw >= 0 ? minRaw : null;
  const maxGhs = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : null;

  return { cat, sort, shapes, genders, materials, colours, minGhs, maxGhs };
}

// ─── Material matching ────────────────────────────────────────────────────────

function frameMatchesMaterial(
  frame: ShopFrame,
  materialIds: MaterialId[],
): boolean {
  if (materialIds.length === 0) return true;
  const m = (frame.material ?? "").toLowerCase();
  return materialIds.some((id) => {
    if (id === "acetate") return m.includes("acetate");
    if (id === "titanium") return m.includes("titanium");
    if (id === "metal") return m.includes("metal") && !m.includes("titanium");
    return false;
  });
}

// ─── Per-facet counts ─────────────────────────────────────────────────────────

export type FacetCounts = {
  shapes: Record<string, number>;
  genders: Record<string, number>;
  materials: Record<MaterialId, number>;
  colours: Record<string, number>;
};

function computeFacetCounts(frames: ShopFrame[]): FacetCounts {
  const shapes: Record<string, number> = {};
  const genders: Record<string, number> = {};
  const materials: Record<string, number> = {};
  const colours: Record<string, number> = {};

  for (const f of frames) {
    if (f.shape) shapes[f.shape] = (shapes[f.shape] ?? 0) + 1;
    if (f.gender) genders[f.gender] = (genders[f.gender] ?? 0) + 1;
    for (const m of MATERIAL_OPTIONS) {
      if (frameMatchesMaterial(f, [m.id])) {
        materials[m.id] = (materials[m.id] ?? 0) + 1;
      }
    }
    for (const c of f.colors) {
      colours[c.name] = (colours[c.name] ?? 0) + 1;
    }
  }

  return {
    shapes,
    genders,
    materials: materials as Record<MaterialId, number>,
    colours,
  };
}

// ─── Filter + sort ────────────────────────────────────────────────────────────

const BADGE_PRIORITY: Record<string, number> = {
  BESTSELLER: 0,
  NEW: 1,
  LIMITED: 2,
};

export type FilterResult = {
  filtered: ShopFrame[];
  total: number;
  facets: FacetCounts;
};

/**
 * Apply parsed filter state to a frame list.
 * `frames` should already be scoped to the active category by the server query.
 */
export function applyShopFilters(
  frames: ShopFrame[],
  params: ParsedShopParams,
): FilterResult {
  // Facet counts are computed over the full category set (not post-filter),
  // so users see how many items each filter would yield.
  const facets = computeFacetCounts(frames);
  const total = frames.length;

  let result = frames;

  if (params.shapes.length > 0) {
    result = result.filter(
      (f) => f.shape && params.shapes.includes(f.shape),
    );
  }

  if (params.genders.length > 0) {
    result = result.filter(
      (f) => f.gender && params.genders.includes(f.gender),
    );
  }

  if (params.materials.length > 0) {
    result = result.filter((f) =>
      frameMatchesMaterial(f, params.materials),
    );
  }

  if (params.colours.length > 0) {
    result = result.filter((f) =>
      f.colors.some((c) => params.colours.includes(c.name)),
    );
  }

  if (params.minGhs !== null) {
    const minPesewa = params.minGhs * 100;
    result = result.filter((f) => f.price_ghs >= minPesewa);
  }

  if (params.maxGhs !== null) {
    const maxPesewa = params.maxGhs * 100;
    result = result.filter((f) => f.price_ghs <= maxPesewa);
  }

  // Sort
  result = [...result].sort((a, b) => {
    switch (params.sort) {
      case "price-low":
        return a.price_ghs - b.price_ghs;
      case "price-high":
        return b.price_ghs - a.price_ghs;
      case "newest": {
        // NEW badge first, then by insertion order
        const aNew = a.badge === "NEW" ? 0 : 1;
        const bNew = b.badge === "NEW" ? 0 : 1;
        return aNew - bNew;
      }
      case "featured":
      default: {
        // Badge priority (BESTSELLER→NEW→LIMITED→none), then name alpha
        const aPri = a.badge != null ? (BADGE_PRIORITY[a.badge] ?? 3) : 3;
        const bPri = b.badge != null ? (BADGE_PRIORITY[b.badge] ?? 3) : 3;
        if (aPri !== bPri) return aPri - bPri;
        return a.name.localeCompare(b.name);
      }
    }
  });

  return { filtered: result, total, facets };
}

// ─── URL builder helpers ──────────────────────────────────────────────────────

/**
 * Serialise a partial filter update into a URLSearchParams string.
 * Pass current params + the changed key/value.
 */
export function buildShopUrl(
  current: ParsedShopParams,
  update: Partial<ParsedShopParams>,
): string {
  const next = { ...current, ...update };
  const p = new URLSearchParams();

  if (next.cat && next.cat !== "optical") p.set("cat", next.cat);
  if (next.sort !== "featured") p.set("sort", next.sort);
  if (next.shapes.length > 0) p.set("shape", next.shapes.join(","));
  if (next.genders.length > 0) p.set("gender", next.genders.join(","));
  if (next.materials.length > 0) p.set("material", next.materials.join(","));
  if (next.colours.length > 0) p.set("colour", next.colours.join(","));
  if (next.minGhs !== null) p.set("min", String(next.minGhs));
  if (next.maxGhs !== null) p.set("max", String(next.maxGhs));

  const qs = p.toString();
  return qs ? `/shop?${qs}` : "/shop";
}
