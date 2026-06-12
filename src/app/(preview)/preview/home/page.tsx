import { getActiveFrames, type ShopFrame } from "@/server/frames";
import { getActiveClinics, type Clinic } from "@/server/clinics";
import { ImmersiveHero } from "@/components/preview/immersive-hero";
import { Manifesto } from "@/components/preview/manifesto";
import { FramesReel } from "@/components/preview/frames-reel";
import { ClinicsCta } from "@/components/preview/clinics-cta";

// Reads live staging data; render on each request so the reel reflects the
// catalogue. Degrades to a curated FrameSVG showcase if data can't be loaded.
export const dynamic = "force-dynamic";

async function loadFrames(): Promise<ShopFrame[]> {
  try {
    return await getActiveFrames();
  } catch (err) {
    console.error("[preview] frames load failed", err);
    return [];
  }
}

async function loadClinics(): Promise<Clinic[]> {
  try {
    return await getActiveClinics();
  } catch (err) {
    console.error("[preview] clinics load failed", err);
    return [];
  }
}

export default async function PreviewHome() {
  const [frames, clinics] = await Promise.all([loadFrames(), loadClinics()]);

  return (
    <main>
      {/* The photoreal frame centerpiece lives inside the hero. */}
      <ImmersiveHero />
      <Manifesto />
      <FramesReel frames={frames} />
      <ClinicsCta clinics={clinics} />
    </main>
  );
}
