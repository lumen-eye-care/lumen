"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/atoms/icon";
import { formatGhs } from "@/lib/format-money";
import {
  LENS_QUIZ_STORAGE_KEY,
  type LensCatalogueView,
} from "@/lib/lens-catalogue";
import {
  QUESTIONS,
  recommendLens,
  type Answers,
  type QuestionId,
} from "@/lib/lens-quiz";

/**
 * Interactive lens-recommendation quiz (US-P1-02, catalogue-aware in the US-P2-02
 * follow-up). Pure-client: each answer advances a step; the final screen runs the
 * rule-based engine over the live catalogue and shows the result with the reasoning
 * behind every line. No server round-trip, no LLM — deterministic and explainable.
 *
 * The result hands off to the builder: "Build this on a frame" persists the
 * recommended slugs to localStorage and links to /shop, where the PDP builder
 * prefills them (same catalogue, so the recommendation is always buildable).
 */
export function LensQuiz({ catalogue }: { catalogue: LensCatalogueView }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState(false);

  const total = QUESTIONS.length;
  const current = QUESTIONS[step];
  const progress = done ? 100 : Math.round((step / total) * 100);

  const recommendation = useMemo(
    () => (done ? recommendLens(answers, catalogue) : null),
    [done, answers, catalogue],
  );

  // Resolve recommended slugs → catalogue views for display.
  const lensType = recommendation?.lensTypeSlug
    ? catalogue.lensTypes.find((t) => t.slug === recommendation.lensTypeSlug) ?? null
    : null;
  const recommendedAddons = (recommendation?.addonSlugs ?? []).flatMap((slug) => {
    const a = catalogue.addons.find((x) => x.slug === slug);
    return a ? [a] : [];
  });

  function choose(id: QuestionId, value: string) {
    const next = { ...answers, [id]: value };
    setAnswers(next);
    if (step + 1 < total) setStep(step + 1);
    else setDone(true);
  }

  function back() {
    if (done) {
      setDone(false);
      return;
    }
    if (step > 0) setStep(step - 1);
  }

  function restart() {
    setAnswers({});
    setStep(0);
    setDone(false);
  }

  /** Persist the recommended build for the PDP builder to pick up. */
  function saveHandoff() {
    if (!recommendation) return;
    try {
      window.localStorage.setItem(
        LENS_QUIZ_STORAGE_KEY,
        JSON.stringify({
          lensTypeSlug: recommendation.lensTypeSlug,
          addonSlugs: recommendation.addonSlugs,
        }),
      );
    } catch {
      // Private mode / storage disabled — the link still works, just no prefill.
    }
  }

  return (
    <div className="lm-card mx-auto max-w-2xl overflow-hidden p-6 sm:p-10" data-animate>
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <p className="lm-label">
            {done ? "Your recommendation" : `Step ${step + 1} of ${total}`}
          </p>
          {(step > 0 || done) && (
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center gap-1 text-sm transition-colors hover:text-[color:var(--lm-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
              style={{ color: "var(--lm-muted)" }}
            >
              <Icon name="arrowLeft" size={14} />
              Back
            </button>
          )}
        </div>
        <div
          className="mt-3 h-1 w-full overflow-hidden rounded-full"
          style={{ background: "var(--lm-hair)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "var(--lm-warm)" }}
          />
        </div>
      </div>

      {!done && current && (
        <div>
          <h2 className="lm-display" style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)" }}>
            {current.prompt}
          </h2>
          <div className="mt-7 grid gap-3">
            {current.options.map((opt) => {
              const selected = answers[current.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => choose(current.id, opt.value)}
                  className="group flex items-center justify-between gap-4 rounded-xl p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
                  style={{
                    background: "var(--lm-base)",
                    border: `1px solid ${selected ? "var(--lm-warm)" : "var(--lm-hair)"}`,
                  }}
                >
                  <span>
                    <span className="block text-[15px] font-medium" style={{ color: "var(--lm-text)" }}>
                      {opt.label}
                    </span>
                    {opt.hint && (
                      <span className="mt-0.5 block text-sm" style={{ color: "var(--lm-muted)" }}>
                        {opt.hint}
                      </span>
                    )}
                  </span>
                  <Icon
                    name="arrow"
                    size={18}
                    className="shrink-0 transition-transform group-hover:translate-x-1"
                    style={{ color: "var(--lm-warm-text)" }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {done && recommendation && (
        <div data-stagger>
          <h2 className="lm-display" style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)" }}>
            We&apos;d suggest{" "}
            <em style={{ fontStyle: "italic", color: "var(--lm-warm-text)" }}>
              {lensType?.name ?? "a single-vision lens"}
            </em>
            .
          </h2>
          {lensType && recommendation.reasons[lensType.slug] && (
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "var(--lm-muted)" }}>
              {recommendation.reasons[lensType.slug]}
            </p>
          )}

          {/* Recommended add-ons */}
          {recommendedAddons.length > 0 && (
            <div className="mt-7 grid gap-3">
              {recommendedAddons.map((a) => (
                <div
                  key={a.slug}
                  className="flex items-start gap-4 rounded-xl p-4"
                  style={{ background: "var(--lm-base)", border: "1px solid var(--lm-hair)" }}
                >
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "var(--lm-tint)", color: "var(--lm-warm-text)" }}
                  >
                    <Icon name="check" size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-semibold" style={{ color: "var(--lm-text)" }}>
                        {a.name}
                      </p>
                      <span className="shrink-0 text-sm" style={{ color: "var(--lm-muted)" }}>
                        {a.included ? "Included" : a.price_ghs > 0 ? `+ ${formatGhs(a.price_ghs)}` : "Free"}
                      </span>
                    </div>
                    {recommendation.reasons[a.slug] && (
                      <p className="mt-0.5 text-sm" style={{ color: "var(--lm-muted)" }}>
                        {recommendation.reasons[a.slug]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Honest guidance notes (not products) */}
          {recommendation.notes.length > 0 && (
            <ul className="mt-6 grid gap-2.5">
              {recommendation.notes.map((note) => (
                <li
                  key={note}
                  className="flex items-start gap-3 text-sm leading-relaxed"
                  style={{ color: "var(--lm-muted)" }}
                >
                  <Icon
                    name="eye"
                    size={15}
                    className="mt-0.5 shrink-0"
                    style={{ color: "var(--lm-sage-text)" }}
                  />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Honest disclaimer + CTAs */}
          <p className="mt-6 text-xs leading-relaxed" style={{ color: "var(--lm-faint)" }}>
            This is guidance to help you choose — not a prescription. Your optometrist
            confirms the exact lens and measurements at your eye test.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/shop" onClick={saveHandoff} className="lm-pill">
              Build this on a frame
              <Icon name="arrow" size={16} />
            </Link>
            <Link href="/book" className="lm-ghost">
              Book an eye test
            </Link>
            <button type="button" onClick={restart} className="lm-ghost">
              <Icon name="arrowLeft" size={14} />
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
