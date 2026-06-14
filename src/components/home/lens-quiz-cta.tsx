import Link from "next/link";
import { Icon } from "@/components/atoms/icon";

/**
 * Lens guidance CTA → the real interactive quiz at /lens-guide (US-P1-02). The
 * quiz runs a deterministic rule-based engine (src/lib/lens-quiz.ts), so this
 * leads with the tool rather than a generic booking nudge.
 */
export function LensQuizCta() {
  return (
    <section className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div
          className="lm-card grid gap-10 overflow-hidden p-8 sm:p-12 lg:grid-cols-2 lg:items-center lg:p-16"
          data-animate
        >
          {/* Copy */}
          <div className="min-w-0">
            <p className="lm-label">Lenses, not just frames</p>
            <h2
              className="lm-display mt-4"
              style={{ fontSize: "clamp(1.9rem, 4.5vw, 3.2rem)" }}
            >
              The right lens matters as much as the frame.
            </h2>
            <p
              className="mt-5 max-w-md text-[15px] leading-relaxed"
              style={{ color: "var(--lm-muted)" }}
            >
              Single-vision, varifocal, blue-light, light-reactive — the lens
              decides how you actually see. Our optometrists match the right
              material and coatings to your screen time, prescription and the
              way you live.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/lens-guide" className="lm-pill">
                Take the lens quiz
                <Icon name="arrow" size={16} />
              </Link>
              <Link href="/book" className="lm-ghost">
                Talk to an optometrist
              </Link>
            </div>
          </div>

          {/* Editorial lens-trait list — static, honest, no fake quiz state */}
          <ul className="grid gap-3">
            {[
              {
                k: "Single vision",
                v: "One prescription, edge to edge. The everyday default.",
              },
              {
                k: "Varifocal",
                v: "Near, middle and distance in one lens — no line.",
              },
              {
                k: "Blue-light filter",
                v: "For long days on screens, in clinic and at your desk.",
              },
              {
                k: "Light-reactive",
                v: "Clear indoors, tinted under the Accra sun.",
              },
            ].map((row) => (
              <li
                key={row.k}
                className="flex items-start gap-4 rounded-xl p-4"
                style={{ background: "var(--lm-base)", border: "1px solid var(--lm-hair)" }}
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
                    {row.k}
                  </p>
                  <p className="mt-0.5 text-sm" style={{ color: "var(--lm-muted)" }}>
                    {row.v}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
