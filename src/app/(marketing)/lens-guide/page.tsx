import type { Metadata } from "next";
import { LensQuiz } from "./lens-quiz";

export const metadata: Metadata = {
  title: "Lens Guide",
  description:
    "Answer five quick questions and get a lens recommendation tuned to how you actually see — single-vision, varifocal, blue-light and more.",
  alternates: { canonical: "/lens-guide" },
};

/**
 * Lens guide (US-P1-02). Server wrapper for SEO + the cinematic hero; the
 * interactive quiz + rule-based recommendation runs client-side in <LensQuiz>.
 */
export default function LensGuidePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="lm-grain relative overflow-hidden px-6 pb-10 pt-12"
        style={{
          background:
            "radial-gradient(120% 140% at 80% 0%, var(--lm-raise) 0%, var(--lm-base) 55%)",
        }}
      >
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <p className="lm-label">Lens guide</p>
          <h1
            className="lm-display mx-auto mt-3 max-w-xl"
            style={{ fontSize: "clamp(2.2rem, 6vw, 3.6rem)" }}
          >
            Find your lens in{" "}
            <em style={{ fontStyle: "italic", color: "var(--lm-warm)" }}>
              five questions
            </em>
            .
          </h1>
          <p
            className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed"
            style={{ color: "var(--lm-muted)" }}
          >
            The lens decides how you actually see. Tell us about your day and
            we&apos;ll match the right type and coatings — then confirm it with
            an optometrist.
          </p>
        </div>
      </section>

      {/* Quiz */}
      <div className="px-6 pb-24 pt-10">
        <LensQuiz />
      </div>
    </div>
  );
}
