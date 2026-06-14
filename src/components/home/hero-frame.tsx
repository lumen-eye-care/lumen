"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { HeroFrameImage } from "./hero-frame-image";

/**
 * Hero frame renderer — the GPU-tier gate (Phase 2).
 *
 * Default / TIER_0–1 (most of the Tecno/Infinix baseline): the CSS-tilt
 * HeroFrameImage. 60fps, zero WebGL cost, no extra bytes parsed.
 *
 * TIER_2+ only: lazy-load the OGL refraction shader (ogl is code-split via
 * next/dynamic, so its bytes never reach low-tier devices). If detect-gpu is
 * unsure, WebGL init fails, or the user prefers reduced motion / coarse
 * pointer, we stay on the CSS path. The shader fades in over the image, and
 * any runtime error falls back cleanly.
 */

const HeroFrameShader = dynamic(
  () => import("./hero-frame-shader").then((m) => m.HeroFrameShader),
  { ssr: false },
);

type Mode = "css" | "shader";

export function HeroFrame({ src, alt }: { src: string; alt?: string }) {
  const [mode, setMode] = useState<Mode>("css");

  useEffect(() => {
    let cancelled = false;

    // Cheap disqualifiers first — skip the benchmark entirely.
    const coarse = !window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData === true;
    if (coarse || reduce || saveData) return;

    (async () => {
      try {
        const { getGPUTier } = await import("detect-gpu");
        const result = await getGPUTier();
        // tier 0–3; gate the shader to genuinely capable GPUs (TIER_2+).
        if (!cancelled && !result.isMobile && result.tier >= 2) {
          setMode("shader");
        }
      } catch {
        // Benchmark failed → stay on the CSS path.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (mode === "shader") {
    return (
      <HeroFrameShader src={src} alt={alt} onError={() => setMode("css")} />
    );
  }
  return <HeroFrameImage src={src} alt={alt} />;
}
