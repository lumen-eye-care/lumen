/**
 * Lens-recommendation engine (US-P1-02).
 *
 * Deterministic, rule-based — NOT an LLM. A lens recommendation is a clinical
 * suggestion: it must be explainable, instant, work offline, and be auditable
 * by an optometrist. Every output here traces to an explicit rule below, and
 * the UI shows the "why" for each. The recommendation is guidance, not a
 * prescription — the result screen says so and routes to a real eye test.
 *
 * Pure functions only (no React, no IO) so the logic is unit-tested in
 * isolation and reused by the client quiz.
 */

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
      { value: "screens", label: "Screens & office work", hint: "Laptop, monitors" },
    ],
  },
  {
    id: "screen",
    prompt: "How long are you on screens on a typical day?",
    options: [
      { value: "low", label: "Under 2 hours" },
      { value: "mid", label: "2–6 hours" },
      { value: "high", label: "6+ hours" },
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

export type Recommendation = {
  /** Primary lens type. */
  lens: { name: string; why: string };
  /** Coatings / add-ons, each with its reason. */
  addOns: { name: string; why: string }[];
  /** Optional sun-lens suggestion (separate pair / clip-on). */
  sun: { name: string; why: string } | null;
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

/**
 * Map a complete (or partial) answer set to a lens recommendation. Missing
 * answers degrade gracefully to the safest general suggestion.
 */
export function recommendLens(a: Answers): Recommendation {
  const presbyopic = isPresbyopic(a);

  // ── Primary lens ──────────────────────────────────────────────
  let lens: Recommendation["lens"];
  if (a.primary === "both" || (presbyopic && a.primary !== "reading")) {
    lens = {
      name: "Varifocal (progressive) lenses",
      why: "You need clear vision at more than one distance — varifocals blend distance, middle and reading into one lens with no visible line.",
    };
  } else if (a.primary === "reading" || (presbyopic && a.primary === "reading")) {
    lens = {
      name: "Reading lenses",
      why: "Your focus is close work, so a single reading prescription tuned to that distance is the simplest, sharpest option.",
    };
  } else if (a.primary === "screens") {
    lens = {
      name: "Single-vision (office / screen)",
      why: "Set for your screen distance, single-vision lenses keep monitors and documents crisp through a long working day.",
    };
  } else {
    lens = {
      name: "Single-vision lenses",
      why: "One correction does the job for your main need — the lightest, most affordable option.",
    };
  }

  // ── Add-ons ───────────────────────────────────────────────────
  const addOns: Recommendation["addOns"] = [
    {
      name: "Anti-reflective coating",
      why: "Cuts glare and reflections for clearer vision and better-looking lenses — we fit it as standard.",
    },
  ];

  if (a.screen === "high" || a.primary === "screens") {
    addOns.push({
      name: "Blue-light filter",
      why: "You spend long stretches on screens — a blue-light filter eases eye strain and harsh artificial light.",
    });
  } else if (a.screen === "mid") {
    addOns.push({
      name: "Blue-light filter (optional)",
      why: "A moderate amount of screen time — worth considering if you notice tired eyes by evening.",
    });
  }

  if (a.outdoor === "often") {
    addOns.push({
      name: "Light-reactive (photochromic)",
      why: "You're outdoors most days — light-reactive lenses darken in the Accra sun and clear indoors, so one pair does both.",
    });
  } else if (a.outdoor === "sometimes") {
    addOns.push({
      name: "Scratch-resistant hard coat",
      why: "For active, in-and-out days — keeps the lenses clearer for longer.",
    });
  }

  // ── Sun option ────────────────────────────────────────────────
  let sun: Recommendation["sun"] = null;
  if (a.outdoor === "often") {
    sun = {
      name: "Polarised prescription sunglasses",
      why: "If you drive a lot, a dedicated polarised pair kills road and water glare better than any indoor lens.",
    };
  }

  return { lens, addOns, sun };
}

/** All questions answered? (Drives the "see result" gate.) */
export function isComplete(a: Answers): boolean {
  return QUESTIONS.every((q) => typeof a[q.id] === "string");
}
