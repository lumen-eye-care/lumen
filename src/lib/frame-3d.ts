/**
 * Phase-3 POC: resolve a frame's 3D model URL.
 *
 * Gated by NEXT_PUBLIC_DEMO_3D_ENABLED (defaults OFF — the 3D section never
 * renders on production / live products while the flag is unset). While on,
 * every frame points at the shared demo .glb so the <model-viewer> pipeline can
 * be demonstrated against staging data.
 *
 * Productionisation: add a nullable `model_url` column to the `frames` table
 * (one real .glb per frame), pass the frame in, and return `frame.model_url`
 * here instead of the shared placeholder. Then drop the flag.
 */
const DEMO_MODEL = "/models/frame-demo.glb";

export function resolveFrameModel(): string | null {
  if (process.env.NEXT_PUBLIC_DEMO_3D_ENABLED !== "true") return null;
  return DEMO_MODEL;
}
