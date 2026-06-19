import type { Metadata } from "next";
import Link from "next/link";
import { getLensCatalogue } from "@/server/lenses";
import { LensQuiz } from "./lens-quiz";

export const metadata: Metadata = {
  title: "Lens Guide",
  description:
    "Answer five quick questions and get a lens recommendation tuned to how you actually see — single-vision, varifocal, office and more — then build it on any frame.",
  alternates: { canonical: "/lens-guide" },
};

// The quiz recommends from the live catalogue, so it must run server-side.
export const dynamic = "force-dynamic";

/**
 * Lens guide (US-P1-02 + US-P2-02 follow-up). Server wrapper for SEO + the
 * cinematic hero; it loads the lens catalogue (the single source of truth) and
 * hands it to the client quiz, so every recommendation maps to a buildable option.
 */
export default async function LensGuidePage() {
  const catalogue = await getLensCatalogue();
  const hasCatalogue = catalogue.lensTypes.length > 0;
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
            <em style={{ fontStyle: "italic", color: "var(--lm-warm-text)" }}>
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
        {hasCatalogue ? (
          <LensQuiz catalogue={catalogue} />
        ) : (
          <div className="lm-card mx-auto max-w-2xl p-6 text-center sm:p-10" data-animate>
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--lm-muted)" }}>
              Our lens menu is being set up. In the meantime, open any frame to build
              your lenses, or book an eye test and we&apos;ll guide you in person.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/shop" className="lm-pill">
                Browse frames
              </Link>
              <Link href="/book" className="lm-ghost">
                Book an eye test
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
