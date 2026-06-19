/**
 * Lens-recommendation engine (US-P1-02, rebuilt for the US-P2-02 follow-up).
 *
 * Deterministic, rule-based — NOT an LLM. A lens recommendation is a clinical
 * suggestion: it must be explainable, instant, work offline, and be auditable by
 * an optometrist. Every output traces to an explicit rule below, and the UI shows
 * the "why". The recommendation is guidance, not a prescription.
 *
 * SINGLE SOURCE OF TRUTH: the engine takes the live lens catalogue and emits only
 * slugs that exist in it, so anything it recommends is always buildable on a frame
 * (the PDP builder reads the same catalogue). It degrades gracefully when a
 * preferred option isn't in the catalogue.
 *
 * Honesty: blue-light is deliberately NEVER auto-recommended — 2025–26 evidence
 * (College of Optometrists / Cochrane) doesn't support eye-strain or eye-health
 * claims. Heavy screen users get an office lens + a 20-20-20 ergonomics note
 * instead. It remains a buildable add-on for anyone who wants it.
 *
 * Pure functions only (no React, no IO) so the logic is unit-tested in isolation
 * and reused by the client quiz.
 */

import type { LensCatalogueView } from "@/lib/lens-catalogue";

export type QuestionId = "primary" | "screen" | "outdoor" | "age" | "current";

export type Question = {
  id: QuestionId;
  prompt: string;
  options: { value: string; label: string; hint?: string }[];
};

export const QUESTIONS: Question[] = [
  {
    id: "primary",
    prompt: "What do you mainly need glasses for?",
    options: [
      { value: "distance", label: "Seeing far away", hint: "Driving, TV, faces" },
      { value: "reading", label: "Reading & close work", hint: "Books, phone, fine print" },
      { value: "both", label: "Both near and far", hint: "I switch between them" },
      { value: "screens", label: "Screens & desk work", hint: "Laptop, monitors, documents" },
    ],
  },
  {
    id: "screen",
    prompt: "On a normal day, how long are you on screens?",
    options: [
      { value: "low", label: "Under 2 hours" },
      { value: "mid", label: "2–6 hours" },
      { value: "high", label: "6+ hours", hint: "Most of the working day" },
    ],
  },
  {
    id: "outdoor",
    prompt: "How often are you outdoors or driving in bright sun?",
    options: [
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Often", hint: "Most days" },
    ],
  },
  {
    id: "age",
    prompt: "Which age range are you in?",
    options: [
      { value: "under40", label: "Under 40" },
      { value: "40to55", label: "40 – 55" },
      { value: "over55", label: "Over 55" },
    ],
  },
  {
    id: "current",
    prompt: "Do you currently wear glasses?",
    options: [
      { value: "none", label: "No, first pair" },
      { value: "single", label: "Single-vision" },
      { value: "varifocal", label: "Varifocals / bifocals" },
      { value: "readers", label: "Readers only" },
    ],
  },
];

export type Answers = Partial<Record<QuestionId, string>>;

/**
 * A catalogue-grounded recommendation. `lensTypeSlug` + every entry in `addonSlugs`
 * is guaranteed present in the catalogue passed to recommendLens (or null/empty).
 * `reasons` maps each recommended slug → its "why"; `notes` are non-product guidance.
 */
export type Recommendation = {
  lensTypeSlug: string | null;
  addonSlugs: string[];
  reasons: Record<string, string>;
  notes: string[];
};

/** True when the answers point at age-related near-vision change (presbyopia). */
function isPresbyopic(a: Answers): boolean {
  return (
    a.age === "40to55" ||
    a.age === "over55" ||
    a.current === "varifocal" ||
    a.current === "readers"
  );
}

/** First preference present in the set, else null. */
function firstPresent(available: Set<string>, prefs: string[]): string | null {
  for (const p of prefs) if (available.has(p)) return p;
  return null;
}

/**
 * Map a (complete or partial) answer set to a catalogue-grounded recommendation.
 * Missing answers degrade to the safest general suggestion; missing catalogue
 * options degrade to the next buildable fallback.
 */
export function recommendLens(a: Answers, catalogue: LensCatalogueView): Recommendation {
  const typeSlugs = new Set(catalogue.lensTypes.map((t) => t.slug));
  const addonSlugs = new Set(catalogue.addons.map((x) => x.slug));
  const presbyopic = isPresbyopic(a);

  const reasons: Record<string, string> = {};
  const notes: string[] = [];

  // ── Primary lens type ─────────────────────────────────────────────
  // Build an ordered preference list per the rule, then resolve to the first
  // option the catalogue actually offers (always falling back to single vision).
  let prefs: string[];
  let why: string;
  if (a.primary === "both" || (presbyopic && a.primary !== "reading")) {
    prefs = ["varifocal", "bifocal", "single"];
    why =
      "You need clear vision at more than one distance. A varifocal blends distance, middle and reading into one lens with no visible line.";
  } else if (a.primary === "reading") {
    prefs = ["reading", "single"];
    why =
      "Your focus is close work, so a single reading prescription tuned to that distance is the simplest, sharpest option.";
  } else if (a.primary === "screens" || a.screen === "high") {
    prefs = ["office", "single"];
    why =
      "You spend long stretches at a desk. An office/computer lens keeps your screen and the space around it sharp through the day.";
  } else {
    prefs = ["single"];
    why = "One correction covers your main need — the lightest, most affordable option.";
  }

  const lensTypeSlug =
    firstPresent(typeSlugs, prefs) ?? catalogue.lensTypes[0]?.slug ?? null;
  if (lensTypeSlug) reasons[lensTypeSlug] = why;

  // ── Add-ons (only ones the catalogue offers) ──────────────────────
  const recommendedAddons: string[] = [];

  if (addonSlugs.has("antireflective")) {
    recommendedAddons.push("antireflective");
    reasons["antireflective"] =
      "Cuts glare and reflections for clearer vision and better-looking lenses — we fit it as standard.";
  }

  if (a.outdoor === "often" && addonSlugs.has("photochromic")) {
    recommendedAddons.push("photochromic");
    reasons["photochromic"] =
      "You're outdoors most days — light-reactive lenses darken in the Accra sun and clear indoors, so one pair does both.";
  }

  // ── Notes (honest guidance, not products) ─────────────────────────
  if (a.screen === "high" || a.primary === "screens") {
    notes.push(
      "On screens for long stretches? The 20-20-20 rule — every 20 minutes, look about 6 metres away for 20 seconds — eases tired eyes more reliably than any lens coating.",
    );
  }
  if (a.outdoor === "often") {
    notes.push(
      "If you drive a lot, ask about a dedicated polarised sun pair — it kills road and water glare better than an everyday lens.",
    );
  }
  notes.push(
    "Got a strong prescription? Ask about thinner high-index lenses when you build — they're lighter and slimmer in the frame.",
  );

  return { lensTypeSlug, addonSlugs: recommendedAddons, reasons, notes };
}

/** All questions answered? (Drives the "see result" gate.) */
export function isComplete(a: Answers): boolean {
  return QUESTIONS.every((q) => typeof a[q.id] === "string");
}
