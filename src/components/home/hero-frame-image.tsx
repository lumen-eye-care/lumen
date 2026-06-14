"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

/**
 * Hero centerpiece — the photoreal Lumen frame, floating. Cursor moves give it
 * a subtle 3D tilt (CSS perspective rotateX/rotateY on the GPU compositor — no
 * WebGL, 60fps on the Tecno/Infinix baseline). Gentle ambient float (.lm-float)
 * + a non-blur rise entrance (.lm-rise). Fine-pointer only; honors
 * prefers-reduced-motion.
 *
 * This is the TIER_0 / default renderer. On capable GPUs the OGL shader
 * (HeroFrame) layers a refraction effect on top — see hero-frame.tsx.
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
      targetY = ((e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)) * 14;
      targetX = -((e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)) * 10;
    };

    const tick = () => {
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;
      el.style.transform = `perspective(1000px) rotateX(${curX.toFixed(2)}deg) rotateY(${curY.toFixed(2)}deg)`;
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
    <div className="lm-rise">
      <div ref={tiltRef} className="lm-float" style={{ willChange: "transform" }}>
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={896}
          priority
          sizes="(max-width: 1024px) 88vw, 44vw"
          className="h-auto w-full select-none"
          style={{ filter: "drop-shadow(0 30px 60px var(--lm-shadow))" }}
        />
      </div>
    </div>
  );
}
