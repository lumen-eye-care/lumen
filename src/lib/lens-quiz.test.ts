import { describe, it, expect } from "vitest";
import {
  recommendLens,
  isComplete,
  QUESTIONS,
  type Answers,
} from "./lens-quiz";

describe("recommendLens", () => {
  it("recommends single-vision for a young distance-only wearer", () => {
    const a: Answers = {
      primary: "distance",
      screen: "low",
      outdoor: "rarely",
      age: "under40",
      current: "none",
    };
    const r = recommendLens(a);
    expect(r.lens.name).toMatch(/single-vision/i);
    // Only the standard AR coating, nothing else.
    expect(r.addOns).toHaveLength(1);
    expect(r.addOns[0].name).toMatch(/anti-reflective/i);
    expect(r.sun).toBeNull();
  });

  it("recommends varifocals when the need is both near and far", () => {
    const r = recommendLens({ primary: "both", age: "under40" });
    expect(r.lens.name).toMatch(/varifocal/i);
  });

  it("recommends varifocals for a 40+ distance wearer (presbyopia)", () => {
    const r = recommendLens({ primary: "distance", age: "40to55" });
    expect(r.lens.name).toMatch(/varifocal/i);
  });

  it("treats current varifocal wearers as presbyopic", () => {
    const r = recommendLens({ primary: "distance", current: "varifocal" });
    expect(r.lens.name).toMatch(/varifocal/i);
  });

  it("recommends reading lenses for close-work-only", () => {
    const r = recommendLens({ primary: "reading", age: "under40" });
    expect(r.lens.name).toMatch(/reading/i);
  });

  it("adds a blue-light filter for heavy screen use", () => {
    const r = recommendLens({ primary: "distance", screen: "high" });
    expect(r.addOns.some((x) => /blue-light/i.test(x.name))).toBe(true);
  });

  it("adds blue-light for screen-primary even without screen hours", () => {
    const r = recommendLens({ primary: "screens" });
    expect(r.lens.name).toMatch(/screen/i);
    expect(r.addOns.some((x) => /blue-light/i.test(x.name))).toBe(true);
  });

  it("adds light-reactive + polarised sun option for frequent outdoors", () => {
    const r = recommendLens({ primary: "distance", outdoor: "often" });
    expect(r.addOns.some((x) => /light-reactive/i.test(x.name))).toBe(true);
    expect(r.sun?.name).toMatch(/polaris/i);
  });

  it("does not suggest a sun pair for indoor lifestyles", () => {
    const r = recommendLens({ primary: "distance", outdoor: "rarely" });
    expect(r.sun).toBeNull();
  });

  it("always includes anti-reflective as the first add-on", () => {
    const r = recommendLens({});
    expect(r.addOns[0].name).toMatch(/anti-reflective/i);
  });

  it("every recommendation carries a non-empty reason", () => {
    const r = recommendLens({
      primary: "both",
      screen: "high",
      outdoor: "often",
      age: "over55",
      current: "varifocal",
    });
    expect(r.lens.why.length).toBeGreaterThan(0);
    expect(r.addOns.every((x) => x.why.length > 0)).toBe(true);
    expect(r.sun?.why.length ?? 1).toBeGreaterThan(0);
  });
});

describe("isComplete", () => {
  it("is false until every question is answered", () => {
    expect(isComplete({ primary: "distance" })).toBe(false);
  });

  it("is true once all questions have an answer", () => {
    const full: Answers = Object.fromEntries(
      QUESTIONS.map((q) => [q.id, q.options[0].value]),
    );
    expect(isComplete(full)).toBe(true);
  });
});
