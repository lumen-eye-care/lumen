"use client";

import { createElement, useEffect, useState } from "react";

/**
 * Thin wrapper around Google's <model-viewer> web component (Phase-3 POC).
 *
 * The runtime is **dynamically imported on mount**, so @google/model-viewer is
 * a separate chunk that only loads when this component actually renders — never
 * on PDPs without a model, and never on the rest of the site. Self-hosted (no
 * CDN), and the .glb is uncompressed + served same-origin, so nothing here
 * needs a CSP widening (script/connect/img all stay on 'self', rule 9).
 *
 * Uses createElement rather than JSX so we don't depend on a custom-element JSX
 * typing shim. Renders a themed skeleton until the element upgrades; falls back
 * to the poster image if the runtime fails to load.
 */
export function ModelViewer({
  src,
  alt,
  poster,
  className = "",
}: {
  src: string;
  alt: string;
  poster?: string;
  className?: string;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading",
  );

  useEffect(() => {
    let active = true;
    import("@google/model-viewer")
      .then(() => active && setStatus("ready"))
      .catch(() => active && setStatus("failed"));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background:
          "radial-gradient(120% 100% at 50% 0%, var(--lm-raise) 0%, var(--lm-deep) 100%)",
        border: "1px solid var(--lm-hair)",
        aspectRatio: "4 / 3",
      }}
    >
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt={alt}
              className="max-h-[70%] w-auto object-contain opacity-70"
            />
          ) : (
            <span
              className="text-sm"
              style={{ color: "var(--lm-faint)" }}
            >
              {status === "failed"
                ? "3D preview unavailable"
                : "Loading 3D preview…"}
            </span>
          )}
        </div>
      )}

      {status === "ready" &&
        createElement("model-viewer", {
          src,
          alt,
          ...(poster ? { poster } : {}),
          "camera-controls": true,
          "auto-rotate": true,
          "rotation-per-second": "18deg",
          "touch-action": "pan-y",
          "interaction-prompt": "none",
          "shadow-intensity": "0.9",
          "shadow-softness": "1",
          exposure: "1.05",
          ar: true,
          "ar-modes": "webxr scene-viewer quick-look",
          loading: "eager",
          reveal: "auto",
          style: {
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
            "--poster-color": "transparent",
          },
        })}
    </div>
  );
}
