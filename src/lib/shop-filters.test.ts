import { describe, it, expect } from "vitest";
import {
  parseShopParams,
  applyShopFilters,
  buildShopUrl,
  countActiveFilters,
  type ParsedShopParams,
} from "@/lib/shop-filters";
import type { ShopFrame } from "@/server/frames";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const base: ShopFrame = {
  id: "1",
  name: "Accra",
  slug: "accra",
  price_ghs: 58000, // 580 GHS in pesewa
  stock: 10,
  badge: "BESTSELLER",
  shape: "round",
  gender: "men",
  material: "Italian Acetate",
  description: null,
  colors: [
    { name: "Midnight", hex: "#1E3148" },
    { name: "Tortoise", hex: "#8B4513" },
  ],
  photo_urls: [],
  category: { id: "c1", slug: "optical", name: "Optical", hero_title: null, hero_subtitle: null },
};

const frames: ShopFrame[] = [
  base,
  {
    ...base,
    id: "2",
    name: "Aburi",
    slug: "aburi",
    price_ghs: 72000, // 720 GHS
    badge: "NEW",
    shape: "cateye",
    gender: "women",
    material: "Italian Acetate",
    colors: [{ name: "Garnet", hex: "#7B2C36" }],
  },
  {
    ...base,
    id: "3",
    name: "Achimota",
    slug: "achimota",
    price_ghs: 85000, // 850 GHS
    badge: null,
    shape: "square",
    gender: "men",
    material: "Japanese Titanium",
    colors: [{ name: "Smoke", hex: "#5A6B7A" }],
  },
  {
    ...base,
    id: "4",
    name: "Labadi",
    slug: "labadi",
    price_ghs: 89000, // 890 GHS
    badge: null,
    shape: "aviator",
    gender: "unisex",
    material: "Metal",
    colors: [{ name: "Cocoa", hex: "#8B7355" }],
  },
];

// ─── parseShopParams ──────────────────────────────────────────────────────────

describe("parseShopParams", () => {
  it("returns defaults when no params given", () => {
    const result = parseShopParams({});
    expect(result.cat).toBe("optical");
    expect(result.sort).toBe("featured");
    expect(result.shapes).toEqual([]);
    expect(result.genders).toEqual([]);
    expect(result.materials).toEqual([]);
    expect(result.colours).toEqual([]);
    expect(result.minGhs).toBeNull();
    expect(result.maxGhs).toBeNull();
  });

  it("parses valid category and sort", () => {
    const result = parseShopParams({ cat: "sun", sort: "price-low" });
    expect(result.cat).toBe("sun");
    expect(result.sort).toBe("price-low");
  });

  it("falls back to 'featured' for unknown sort", () => {
    const result = parseShopParams({ sort: "EVIL_VALUE" });
    expect(result.sort).toBe("featured");
  });

  it("parses comma-joined shape/gender/material/colour", () => {
    const result = parseShopParams({
      shape: "round,cateye",
      gender: "women",
      material: "acetate,titanium",
      colour: "Midnight,Garnet",
    });
    expect(result.shapes).toEqual(["round", "cateye"]);
    expect(result.genders).toEqual(["women"]);
    expect(result.materials).toEqual(["acetate", "titanium"]);
    expect(result.colours).toEqual(["Midnight", "Garnet"]);
  });

  it("drops unknown/injected shape values", () => {
    const result = parseShopParams({ shape: "round,INJECTED; DROP TABLE" });
    expect(result.shapes).toEqual(["round"]);
  });

  it("parses price range from GHS strings", () => {
    const result = parseShopParams({ min: "200", max: "800" });
    expect(result.minGhs).toBe(200);
    expect(result.maxGhs).toBe(800);
  });

  it("ignores negative or non-numeric price", () => {
    const result = parseShopParams({ min: "-50", max: "abc" });
    expect(result.minGhs).toBeNull();
    expect(result.maxGhs).toBeNull();
  });
});

// ─── applyShopFilters ─────────────────────────────────────────────────────────

const defaultParams: ParsedShopParams = {
  cat: "optical",
  sort: "featured",
  shapes: [],
  genders: [],
  materials: [],
  colours: [],
  minGhs: null,
  maxGhs: null,
};

describe("applyShopFilters", () => {
  it("returns all frames with no filters active", () => {
    const { filtered, total } = applyShopFilters(frames, defaultParams);
    expect(filtered).toHaveLength(4);
    expect(total).toBe(4);
  });

  it("filters by shape", () => {
    const { filtered } = applyShopFilters(frames, {
      ...defaultParams,
      shapes: ["round"],
    });
    expect(filtered.every((f) => f.shape === "round")).toBe(true);
    expect(filtered).toHaveLength(1);
  });

  it("filters by multiple shapes (OR logic)", () => {
    const { filtered } = applyShopFilters(frames, {
      ...defaultParams,
      shapes: ["round", "cateye"],
    });
    expect(filtered).toHaveLength(2);
  });

  it("filters by gender", () => {
    const { filtered } = applyShopFilters(frames, {
      ...defaultParams,
      genders: ["women"],
    });
    expect(filtered.every((f) => f.gender === "women")).toBe(true);
  });

  it("filters by material acetate", () => {
    const { filtered } = applyShopFilters(frames, {
      ...defaultParams,
      materials: ["acetate"],
    });
    expect(filtered.every((f) => f.material?.toLowerCase().includes("acetate"))).toBe(true);
  });

  it("filters titanium without including plain metal", () => {
    const { filtered } = applyShopFilters(frames, {
      ...defaultParams,
      materials: ["titanium"],
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].slug).toBe("achimota");
  });

  it("filters by colour", () => {
    const { filtered } = applyShopFilters(frames, {
      ...defaultParams,
      colours: ["Garnet"],
    });
    expect(filtered.every((f) => f.colors.some((c) => c.name === "Garnet"))).toBe(true);
  });

  it("filters by min price (GHS)", () => {
    // min 800 GHS = 80000 pesewa → Achimota (850) and Labadi (890) pass
    const { filtered } = applyShopFilters(frames, {
      ...defaultParams,
      minGhs: 800,
    });
    expect(filtered.every((f) => f.price_ghs >= 80000)).toBe(true);
    expect(filtered).toHaveLength(2);
  });

  it("filters by max price (GHS)", () => {
    const { filtered } = applyShopFilters(frames, {
      ...defaultParams,
      maxGhs: 600,
    });
    expect(filtered.every((f) => f.price_ghs <= 60000)).toBe(true);
  });

  it("returns empty when no frames match", () => {
    const { filtered } = applyShopFilters(frames, {
      ...defaultParams,
      shapes: ["hex"],
    });
    expect(filtered).toHaveLength(0);
  });

  it("sorts featured: BESTSELLER first, then NEW, then untagged", () => {
    const { filtered } = applyShopFilters(frames, {
      ...defaultParams,
      sort: "featured",
    });
    expect(filtered[0].badge).toBe("BESTSELLER");
    expect(filtered[1].badge).toBe("NEW");
  });

  it("sorts price-low ascending", () => {
    const { filtered } = applyShopFilters(frames, {
      ...defaultParams,
      sort: "price-low",
    });
    for (let i = 1; i < filtered.length; i++) {
      expect(filtered[i].price_ghs).toBeGreaterThanOrEqual(filtered[i - 1].price_ghs);
    }
  });

  it("sorts price-high descending", () => {
    const { filtered } = applyShopFilters(frames, {
      ...defaultParams,
      sort: "price-high",
    });
    for (let i = 1; i < filtered.length; i++) {
      expect(filtered[i].price_ghs).toBeLessThanOrEqual(filtered[i - 1].price_ghs);
    }
  });

  it("computes facet counts over full set, not filtered subset", () => {
    const { facets } = applyShopFilters(frames, {
      ...defaultParams,
      shapes: ["round"], // filtered to 1 frame
    });
    // Facets count across all 4 frames
    expect(facets.shapes["round"]).toBe(1);
    expect(facets.shapes["cateye"]).toBe(1);
    expect(facets.genders["men"]).toBe(2);
  });
});

// ─── buildShopUrl ─────────────────────────────────────────────────────────────

describe("buildShopUrl", () => {
  it("returns /shop for all-default state", () => {
    const params = parseShopParams({});
    expect(buildShopUrl(params, {})).toBe("/shop");
  });

  it("includes cat param when not optical (default)", () => {
    const params = parseShopParams({});
    expect(buildShopUrl(params, { cat: "sun" })).toBe("/shop?cat=sun");
  });

  it("omits cat param when switching back to optical", () => {
    const params = parseShopParams({ cat: "sun" });
    const url = buildShopUrl(params, { cat: "optical" });
    expect(url).toBe("/shop");
  });

  it("serialises multiple shapes comma-joined", () => {
    const params = parseShopParams({});
    const url = buildShopUrl(params, { shapes: ["round", "oval"] });
    expect(url).toContain("shape=round%2Coval");
  });
});

describe("countActiveFilters", () => {
  it("is zero for default params (sort/cat don't count)", () => {
    expect(countActiveFilters(parseShopParams({ cat: "sun", sort: "newest" }))).toBe(0);
  });

  it("counts each selected facet, including price bounds", () => {
    const params = parseShopParams({
      shape: "round,oval",
      gender: "men",
      colour: "Midnight",
      min: "100",
      max: "500",
    });
    // 2 shapes + 1 gender + 1 colour + min + max = 6
    expect(countActiveFilters(params)).toBe(6);
  });
});
