"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { FrameSVG } from "@/components/atoms/frame-svg";

/**
 * Decides between the real Three.js viewer and a static SVG poster, and keeps
 * Three.js out of the bundle for everyone who can't (or shouldn't) run it:
 * SSR, no-WebGL, and prefers-reduced-motion all get the poster and never
 * trigger the dynamic import. Same box dimensions both ways → no layout shift.
 */
const Frame3DViewer = dynamic(
  () => import("./frame-3d-viewer").then((m) => m.Frame3DViewer),
  { ssr: false, loading: () => null },
);

function Poster({ shape }: { shape: string }) {
  return (
    <div className="flex aspect-square w-full items-center justify-center">
      <div className="w-3/4">
        <FrameSVG shape={shape} color="#f2f2f0" />
      </div>
    </div>
  );
}

export function Frame3DStage({
  shape,
  motion = "scroll",
}: {
  shape: string;
  /** Forwarded to the viewer: "hero" entrance-spin vs "scroll" signature. */
  motion?: "hero" | "scroll";
}) {
  const [decision, setDecision] = useState<"poster" | "3d" | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let webgl = false;
    try {
      const canvas = document.createElement("canvas");
      webgl = !!(
        canvas.getContext("webgl2") || canvas.getContext("webgl")
      );
    } catch {
      webgl = false;
    }

    // Defer one frame so the poster paints first (no hydration mismatch) and we
    // avoid a synchronous setState inside the effect body.
    const id = window.requestAnimationFrame(() =>
      setDecision(reduce || !webgl ? "poster" : "3d"),
    );
    return () => window.cancelAnimationFrame(id);
  }, []);

  // Until decided (and on SSR), show the sharp poster — also the graceful
  // fallback for reduced-motion / no-WebGL.
  if (decision !== "3d") return <Poster shape={shape} />;
  return <Frame3DViewer shape={shape} mode={motion} />;
}
