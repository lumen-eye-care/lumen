import { describe, it, expect } from "vitest";
import { recommendLens, isComplete, QUESTIONS, type Answers } from "./lens-quiz";
import type { LensCatalogueView } from "./lens-catalogue";

// A fixture catalogue mirroring the seeded shape (subset). The engine must only
// ever emit slugs that appear here.
const catalogue: LensCatalogueView = {
  lensTypes: [
    { slug: "single", name: "Single vision", description: null, price_ghs: 0, badge: null },
    { slug: "reading", name: "Reading", description: null, price_ghs: 0, badge: null },
    { slug: "office", name: "Office / computer", description: null, price_ghs: 8000, badge: null },
    { slug: "bifocal", name: "Bifocal", description: null, price_ghs: 35000, badge: null },
    { slug: "varifocal", name: "Varifocal", description: null, price_ghs: 48000, badge: null },
    { slug: "plano", name: "Plano", description: null, price_ghs: 0, badge: null },
  ],
  addons: [
    { slug: "antireflective", name: "Anti-reflective", description: null, price_ghs: 0, included: true, group: "coating", singleSelect: false },
    { slug: "bluelight", name: "Blue-light filter", description: null, price_ghs: 12000, included: false, group: "coating", singleSelect: false },
    { slug: "photochromic", name: "Light-reactive", description: null, price_ghs: 32000, included: false, group: "sun", singleSelect: false },
    { slug: "index150", name: "Standard 1.50", description: null, price_ghs: 0, included: true, group: "thickness", singleSelect: true },
  ],
};

const typeSlugs = catalogue.lensTypes.map((t) => t.slug);

describe("recommendLens — catalogue-grounded", () => {
  it("only ever emits slugs that exist in the catalogue", () => {
    const a: Answers = { primary: "both", screen: "high", outdoor: "often", age: "over55", current: "varifocal" };
    const r = recommendLens(a, catalogue);
    expect(typeSlugs).toContain(r.lensTypeSlug);
    for (const slug of r.addonSlugs) {
      expect(catalogue.addons.map((x) => x.slug)).toContain(slug);
    }
  });

  it("recommends single-vision for a young distance-only wearer", () => {
    const r = recommendLens(
      { primary: "distance", screen: "low", outdoor: "rarely", age: "under40", current: "none" },
      catalogue,
    );
    expect(r.lensTypeSlug).toBe("single");
    expect(r.addonSlugs).toEqual(["antireflective"]);
  });

  it("recommends varifocals when the need is both near and far", () => {
    expect(recommendLens({ primary: "both", age: "under40" }, catalogue).lensTypeSlug).toBe("varifocal");
  });

  it("recommends varifocals for a 40+ distance wearer (presbyopia)", () => {
    expect(recommendLens({ primary: "distance", age: "40to55" }, catalogue).lensTypeSlug).toBe("varifocal");
  });

  it("treats current varifocal wearers as presbyopic", () => {
    expect(recommendLens({ primary: "distance", current: "varifocal" }, catalogue).lensTypeSlug).toBe("varifocal");
  });

  it("recommends a reading lens for close-work-only", () => {
    expect(recommendLens({ primary: "reading", age: "under40" }, catalogue).lensTypeSlug).toBe("reading");
  });

  it("recommends an office lens for heavy screen use (not blue-light)", () => {
    const r = recommendLens({ primary: "distance", screen: "high" }, catalogue);
    expect(r.lensTypeSlug).toBe("office");
    expect(r.addonSlugs).not.toContain("bluelight");
    // The honest path: a 20-20-20 ergonomics note rather than a blue-light claim.
    expect(r.notes.some((n) => /20-20-20/.test(n))).toBe(true);
  });

  it("recommends an office lens for screen-primary work", () => {
    expect(recommendLens({ primary: "screens" }, catalogue).lensTypeSlug).toBe("office");
  });

  it("NEVER auto-recommends blue-light, on any answer combination", () => {
    const combos: Answers[] = [
      { primary: "screens", screen: "high" },
      { primary: "distance", screen: "high", current: "single" },
      { primary: "both", screen: "high", outdoor: "often", age: "over55" },
    ];
    for (const a of combos) {
      expect(recommendLens(a, catalogue).addonSlugs).not.toContain("bluelight");
    }
  });

  it("adds light-reactive + a polarised-pair note for frequent outdoors", () => {
    const r = recommendLens({ primary: "distance", outdoor: "often" }, catalogue);
    expect(r.addonSlugs).toContain("photochromic");
    expect(r.notes.some((n) => /polaris/i.test(n))).toBe(true);
  });

  it("always includes anti-reflective as an add-on", () => {
    expect(recommendLens({}, catalogue).addonSlugs).toContain("antireflective");
  });

  it("falls back to a buildable option when a preferred type is absent", () => {
    // Catalogue without varifocal/bifocal — a presbyope must still get something buildable.
    const slim: LensCatalogueView = {
      lensTypes: [{ slug: "single", name: "Single vision", description: null, price_ghs: 0, badge: null }],
      addons: catalogue.addons,
    };
    const r = recommendLens({ primary: "both", age: "over55" }, slim);
    expect(slim.lensTypes.map((t) => t.slug)).toContain(r.lensTypeSlug);
    expect(r.lensTypeSlug).toBe("single");
  });

  it("emits a non-empty reason for every recommended slug", () => {
    const r = recommendLens(
      { primary: "both", screen: "high", outdoor: "often", age: "over55", current: "varifocal" },
      catalogue,
    );
    expect(r.lensTypeSlug && r.reasons[r.lensTypeSlug]?.length).toBeGreaterThan(0);
    for (const slug of r.addonSlugs) {
      expect(r.reasons[slug]?.length ?? 0).toBeGreaterThan(0);
    }
  });
});

describe("isComplete", () => {
  it("is false until every question is answered", () => {
    expect(isComplete({ primary: "distance" })).toBe(false);
  });

  it("is true once all questions have an answer", () => {
    const full: Answers = Object.fromEntries(QUESTIONS.map((q) => [q.id, q.options[0].value]));
    expect(isComplete(full)).toBe(true);
  });
});
