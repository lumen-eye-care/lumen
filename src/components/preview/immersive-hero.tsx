import Link from "next/link";
import { Icon } from "@/components/atoms/icon";
import { HeroFrameImage } from "./hero-frame-image";

/**
 * Hero — full-viewport Cinematic Dark. The centerpiece is the Higgsfield-
 * generated photoreal Lumen frame, floating with a cursor-driven 3D tilt over a
 * deep-navy field + radial warm glow + film grain (from .preview-root). The
 * headline rises into focus; a warm scan line sweeps the field.
 *
 * Upgrade path: a textured GLB (Higgsfield image_to_3d, ~20 credits) can replace
 * the still with a true real-time 3D frame via the Frame3DStage viewer that
 * already exists in frame-3d/.
 */
export function ImmersiveHero() {
  return (
    <section className="relative flex min-h-dvh items-center overflow-hidden">
      {/* Background field: layered gradient + glow + generated-media slot. */}
      <div
        className="absolute inset-0"
        data-asset="HERO-STILL"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(120% 90% at 70% 20%, var(--pv-raise) 0%, var(--pv-base) 48%, var(--pv-deepest) 100%)",
        }}
      />
      <div className="pv-scan" aria-hidden="true" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-6 pt-28 pb-16 lg:grid-cols-2 lg:gap-12 lg:pt-0 lg:pb-0">
        {/* Copy. */}
        <div className="min-w-0 max-w-xl">
          <p className="pv-label pv-focus-in d1">Lumen · Accra, Ghana</p>
          <h1
            className="pv-display pv-focus-in d2 mt-5"
            style={{ fontSize: "clamp(3rem, 9vw, 7.5rem)" }}
          >
            Vision, brought
            <br />
            into{" "}
            <em style={{ fontStyle: "italic", color: "var(--pv-warm)" }}>
              focus
            </em>
            .
          </h1>
          <p
            className="pv-focus-in d3 mt-7 max-w-md text-lg leading-relaxed"
            style={{ color: "var(--pv-muted)" }}
          >
            Premium frames designed in Ghana — Italian acetate, Japanese
            titanium, Swiss lenses. The first Lumen collection, made to be seen
            in.
          </p>
          <div className="pv-focus-in d4 mt-9 flex flex-wrap items-center gap-3">
            <Link href="#frames" className="pv-pill">
              Explore the collection
              <Icon name="arrow" size={16} />
            </Link>
            <Link href="/book" className="pv-ghost">
              Book an eye test
            </Link>
          </div>
        </div>

        {/* The centerpiece — the photoreal Lumen frame, floating. Glow sits
            behind it; capped so it never overflows or pushes the copy off. */}
        <div className="relative mx-auto w-full min-w-0 max-w-[520px]">
          <div
            className="pv-glow"
            aria-hidden="true"
            style={{
              width: "80%",
              height: "70%",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              opacity: 0.45,
            }}
          />
          <HeroFrameImage src="/preview/frame-hero.png" />
        </div>
      </div>

      {/* Scroll cue. */}
      <div
        className="pv-scrollcue absolute inset-x-0 bottom-8 z-10 flex justify-center"
        aria-hidden="true"
      >
        <Icon name="chev" size={26} style={{ color: "var(--pv-faint)" }} />
      </div>
    </section>
  );
}
