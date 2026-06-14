"use client";

import { useState } from "react";
import { Icon } from "@/components/atoms/icon";
import { ModelViewer } from "./model-viewer";

/**
 * PDP "See it in 3D" section (Phase-3 POC). The <model-viewer> runtime + the
 * .glb only load when the visitor taps the button, so the heavy 3D code never
 * costs anything on first paint — important for the Tecno/Infinix baseline.
 *
 * On Android, model-viewer's "view in your space" AR button appears inside the
 * viewer (Scene Viewer). iOS Quick Look additionally needs an `ios-src` .usdz
 * (not generated for this POC). Desktop shows interactive 3D.
 */
export function Frame3DSection({
  modelSrc,
  name,
  poster,
}: {
  modelSrc: string;
  name: string;
  poster?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="lm-label">New · 3D preview</p>
          <h2
            className="lm-display mt-2"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
          >
            See the {name} in 3D
          </h2>
          <p
            className="mt-2 max-w-md text-sm"
            style={{ color: "var(--lm-muted)" }}
          >
            Spin it, zoom in on the detailing — and on a supported phone, tap{" "}
            <span style={{ color: "var(--lm-text)" }}>view in your space</span>{" "}
            to place it on your desk in AR.
          </p>
        </div>

        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="lm-pill"
          >
            View in 3D
            <Icon name="arrow" size={16} />
          </button>
        )}
      </div>

      {open && (
        <div className="mt-6">
          <ModelViewer
            src={modelSrc}
            alt={`Interactive 3D model of the ${name} frame`}
            poster={poster}
          />
          <p
            className="mt-3 text-center text-xs"
            style={{ color: "var(--lm-faint)" }}
          >
            Demo model — a 3D preview pipeline shown on placeholder geometry.
          </p>
        </div>
      )}
    </section>
  );
}
