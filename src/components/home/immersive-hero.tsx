import Link from "next/link";
import { Icon } from "@/components/atoms/icon";
import { HeroFrame } from "./hero-frame";

/**
 * Home hero — full-viewport cinematic. The centerpiece is the photoreal Lumen
 * frame (HeroFrame: OGL refraction on capable GPUs, CSS tilt otherwise), over a
 * layered gradient field + radial warm glow + warm scan line. The headline
 * resolves from blur to sharp.
 *
 * Placement fix vs the old preview: the section is min-h-dvh and the content is
 * vertically centred with a top pad of var(--nav-h) on every breakpoint, so the
 * headline never collides with the fixed header (the prior `lg:pt-0` bug).
 */
export function ImmersiveHero() {
  return (
    <section
      className="lm-grain relative flex min-h-dvh items-center overflow-hidden"
      style={{
        paddingTop: "var(--nav-h)",
        background:
          "radial-gradient(120% 90% at 72% 18%, var(--lm-raise) 0%, var(--lm-base) 46%, var(--lm-deepest) 100%)",
      }}
    >
      <div className="lm-scan" aria-hidden="true" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-6 py-12 lg:grid-cols-2 lg:gap-12">
        {/* Copy */}
        <div className="min-w-0 max-w-xl">
          <p className="lm-label lm-focus-in d1">Lumen · Accra, Ghana</p>
          <h1
            className="lm-display lm-focus-in d2 mt-5"
            style={{ fontSize: "clamp(2.75rem, 8vw, 6.5rem)" }}
          >
            Vision, brought
            <br />
            into{" "}
            <em style={{ fontStyle: "italic", color: "var(--lm-warm)" }}>
              focus
            </em>
            .
          </h1>
          <p
            className="lm-focus-in d3 mt-7 max-w-md text-lg leading-relaxed"
            style={{ color: "var(--lm-muted)" }}
          >
            Premium frames designed in Ghana — Italian acetate, Japanese
            titanium, Swiss lenses. The first Lumen collection, made to be seen
            in.
          </p>
          <div className="lm-focus-in d4 mt-9 flex flex-wrap items-center gap-3">
            <Link href="#frames" className="lm-pill">
              Explore the collection
              <Icon name="arrow" size={16} />
            </Link>
            <Link href="/book" className="lm-ghost">
              Book an eye test
            </Link>
          </div>
        </div>

        {/* Centerpiece — the floating frame. Glow sits behind it, capped so it
            never overflows or pushes the copy. */}
        <div className="relative mx-auto w-full min-w-0 max-w-[520px]">
          <div
            className="lm-glow"
            aria-hidden="true"
            style={{
              width: "80%",
              height: "70%",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
            }}
          />
          <HeroFrame src="/preview/frame-hero.png" />
        </div>
      </div>

      {/* Scroll cue */}
      <div
        className="lm-scrollcue absolute inset-x-0 bottom-7 z-10 flex justify-center"
        aria-hidden="true"
      >
        <Icon name="chev" size={26} style={{ color: "var(--lm-faint)" }} />
      </div>
    </section>
  );
}
