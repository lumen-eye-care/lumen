"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

/**
 * Hero centerpiece — the Higgsfield-generated photoreal Lumen frame, floating.
 * Cursor moves give it a subtle 3D tilt (perspective rotateX/rotateY, eased) so
 * the still reads as a tangible object, not a flat sticker. Gentle ambient float
 * (.pv-float) + a non-blur rise entrance (.pv-rise). Fine-pointer only; honors
 * prefers-reduced-motion (stays static). No WebGL, no blur.
 */
export function HeroFrameImage({
  src,
  alt = "Lumen frame",
}: {
  src: string;
  alt?: string;
}) {
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tiltRef.current;
    if (!el) return;
    if (
      !window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let curX = 0;
    let curY = 0;
    let targetX = 0;
    let targetY = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      targetY = ((e.clientX - cx) / (window.innerWidth / 2)) * 14; // rotateY
      targetX = -((e.clientY - cy) / (window.innerHeight / 2)) * 10; // rotateX
    };

    const tick = () => {
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;
      el.style.transform = `perspective(1000px) rotateX(${curX.toFixed(
        2,
      )}deg) rotateY(${curY.toFixed(2)}deg)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className="pv-rise">
      <div ref={tiltRef} className="pv-float" style={{ willChange: "transform" }}>
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={896}
          priority
          sizes="(max-width: 1024px) 88vw, 44vw"
          className="h-auto w-full select-none"
          style={{
            filter: "drop-shadow(0 30px 60px rgba(5,15,27,0.55))",
          }}
        />
      </div>
    </div>
  );
}
