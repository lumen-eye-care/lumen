"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/atoms/icon";

/**
 * Home hero — "Ambient field". A living background of warm/sage/blue light pools
 * that drift on their own and lean toward the cursor, over the gradient field +
 * film grain. No product art. The headline "Vision, brought into focus" performs
 * the brand line literally: it loads out of focus (blurred) and resolves sharp,
 * one time, on mount (.lm-headline-focus).
 *
 * Cursor lean is written as CSS custom properties (--nx/--ny, -1..1) by one
 * eased rAF loop — no per-frame React re-render. Coarse-pointer / reduced-motion
 * fall back to a slow auto-drift so it still breathes; the headline focus-pull is
 * disabled under reduced-motion (stays sharp).
 */

// Reactive light pools. `depth` = how far each leans toward the cursor.
const BLOBS = [
  { c: "var(--lm-warm)", x: "66%", y: "38%", s: "46vmin", depth: 44, anim: "lmAmbDrift1 13s" },
  { c: "var(--lm-blue)", x: "80%", y: "70%", s: "40vmin", depth: 64, anim: "lmAmbDrift2 17s" },
  { c: "var(--lm-sage)", x: "44%", y: "72%", s: "34vmin", depth: 30, anim: "lmAmbDrift1 15s" },
  { c: "var(--lm-warm)", x: "88%", y: "22%", s: "24vmin", depth: 80, anim: "lmAmbDrift2 11s" },
  { c: "var(--lm-blue)", x: "30%", y: "30%", s: "20vmin", depth: 22, anim: "lmAmbDrift1 19s" },
];

function AmbientField() {
  return (
    <div
      aria-hidden="true"
      className="lm-ambient-field"
      style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}
    >
      {BLOBS.map((b, i) => (
        <div
          key={i}
          style={
            {
              position: "absolute",
              left: b.x,
              top: b.y,
              width: b.s,
              height: b.s,
              transform:
                "translate(-50%,-50%) translate(calc(var(--nx,0) * 1px * var(--d)), calc(var(--ny,0) * 1px * var(--d)))",
              borderRadius: "50%",
              background: `radial-gradient(circle at 50% 50%, color-mix(in srgb, ${b.c} 68%, transparent) 0%, transparent 68%)`,
              filter: "blur(34px)",
              "--d": String(b.depth),
              animation: `${b.anim} ease-in-out infinite`,
              willChange: "transform, translate",
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function ImmersiveHero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const target = { x: 0, y: 0 }; // normalized -1..1
    const cur = { x: 0, y: 0 };
    let raf = 0;
    let t = 0;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      target.x = Math.min(1, Math.max(-1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      target.y = Math.min(1, Math.max(-1, ((e.clientY - r.top) / r.height - 0.5) * 2));
    };

    const tick = () => {
      if (!fine || reduce) {
        t += 0.006;
        target.x = Math.sin(t) * 0.5;
        target.y = Math.cos(t * 0.8) * 0.36;
      }
      cur.x += (target.x - cur.x) * 0.07;
      cur.y += (target.y - cur.y) * 0.07;
      el.style.setProperty("--nx", cur.x.toFixed(3));
      el.style.setProperty("--ny", cur.y.toFixed(3));
      raf = requestAnimationFrame(tick);
    };

    if (fine && !reduce) window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="lm-grain relative flex min-h-dvh items-center overflow-hidden"
      style={{
        paddingTop: "var(--nav-h)",
        background:
          "radial-gradient(120% 90% at 72% 18%, var(--lm-raise) 0%, var(--lm-base) 46%, var(--lm-deepest) 100%)",
      }}
    >
      <AmbientField />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-12">
        <div className="min-w-0 max-w-2xl">
          <p className="lm-label lm-focus-in d1">Lumen · Accra, Ghana</p>
          <h1
            className="lm-display mt-5"
            style={{ fontSize: "clamp(2.75rem, 8vw, 6.5rem)" }}
          >
            Vision, brought
            <br />
            into{" "}
            <em className="lm-headline-focus" style={{ fontStyle: "italic", color: "var(--lm-warm-text)" }}>focus</em>.
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
      </div>

      <div
        className="lm-scrollcue absolute inset-x-0 bottom-7 z-10 flex justify-center"
        aria-hidden="true"
      >
        <Icon name="chev" size={26} style={{ color: "var(--lm-faint)" }} />
      </div>
    </section>
  );
}
