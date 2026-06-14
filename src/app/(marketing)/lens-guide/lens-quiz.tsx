"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/atoms/icon";
import {
  QUESTIONS,
  recommendLens,
  type Answers,
  type QuestionId,
} from "@/lib/lens-quiz";

/**
 * Interactive lens-recommendation quiz (US-P1-02). Pure-client: each answer
 * advances a step; the final screen runs the rule-based engine in
 * `recommendLens` and shows the result with the reasoning behind every line.
 * No server round-trip, no LLM — deterministic and explainable.
 */
export function LensQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState(false);

  const total = QUESTIONS.length;
  const current = QUESTIONS[step];
  const progress = done ? 100 : Math.round((step / total) * 100);

  const recommendation = useMemo(
    () => (done ? recommendLens(answers) : null),
    [done, answers],
  );

  function choose(id: QuestionId, value: string) {
    const next = { ...answers, [id]: value };
    setAnswers(next);
    if (step + 1 < total) {
      setStep(step + 1);
    } else {
      setDone(true);
    }
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

  return (
    <div
      className="lm-card mx-auto max-w-2xl overflow-hidden p-6 sm:p-10"
      data-animate
    >
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
          <h2
            className="lm-display"
            style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)" }}
          >
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
                    <span
                      className="block text-[15px] font-medium"
                      style={{ color: "var(--lm-text)" }}
                    >
                      {opt.label}
                    </span>
                    {opt.hint && (
                      <span
                        className="mt-0.5 block text-sm"
                        style={{ color: "var(--lm-muted)" }}
                      >
                        {opt.hint}
                      </span>
                    )}
                  </span>
                  <Icon
                    name="arrow"
                    size={18}
                    className="shrink-0 transition-transform group-hover:translate-x-1"
                    style={{ color: "var(--lm-warm)" }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {done && recommendation && (
        <div data-stagger>
          <h2
            className="lm-display"
            style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)" }}
          >
            We&apos;d suggest{" "}
            <em style={{ fontStyle: "italic", color: "var(--lm-warm)" }}>
              {recommendation.lens.name}
            </em>
            .
          </h2>
          <p
            className="mt-4 text-[15px] leading-relaxed"
            style={{ color: "var(--lm-muted)" }}
          >
            {recommendation.lens.why}
          </p>

          {/* Add-ons */}
          <div className="mt-7 grid gap-3">
            {recommendation.addOns.map((row) => (
              <div
                key={row.name}
                className="flex items-start gap-4 rounded-xl p-4"
                style={{
                  background: "var(--lm-base)",
                  border: "1px solid var(--lm-hair)",
                }}
              >
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "var(--lm-tint)", color: "var(--lm-warm)" }}
                >
                  <Icon name="check" size={14} />
                </span>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--lm-text)" }}
                  >
                    {row.name}
                  </p>
                  <p
                    className="mt-0.5 text-sm"
                    style={{ color: "var(--lm-muted)" }}
                  >
                    {row.why}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {recommendation.sun && (
            <div
              className="mt-3 flex items-start gap-4 rounded-xl p-4"
              style={{
                background: "var(--lm-tint)",
                border: "1px solid var(--lm-hair)",
              }}
            >
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ background: "var(--lm-warm)", color: "#1a0f0a" }}
              >
                <Icon name="sun" size={14} />
              </span>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--lm-text)" }}
                >
                  Worth adding: {recommendation.sun.name}
                </p>
                <p className="mt-0.5 text-sm" style={{ color: "var(--lm-muted)" }}>
                  {recommendation.sun.why}
                </p>
              </div>
            </div>
          )}

          {/* Honest disclaimer + CTAs */}
          <p
            className="mt-6 text-xs leading-relaxed"
            style={{ color: "var(--lm-faint)" }}
          >
            This is guidance to help you choose — not a prescription. Your
            optometrist confirms the exact lens and measurements at your eye
            test.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/book" className="lm-pill">
              Book an eye test
              <Icon name="arrow" size={16} />
            </Link>
            <Link href="/shop" className="lm-ghost">
              Browse frames
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
