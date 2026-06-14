import { SiteHeader } from "@/components/organisms/site-header";
import { SiteFooter } from "@/components/organisms/site-footer";
import { getActiveFrames, type ShopFrame } from "@/server/frames";
import { getActiveClinics, type Clinic } from "@/server/clinics";
import { ImmersiveHero } from "@/components/home/immersive-hero";
import { Manifesto } from "@/components/home/manifesto";
import { TwoPaths } from "@/components/home/two-paths";
import { FramesReel } from "@/components/home/frames-reel";
import { LensQuizCta } from "@/components/home/lens-quiz-cta";
import { ClinicsCta } from "@/components/home/clinics-cta";

/**
 * Home — the immersive landing. Lives outside the (marketing) route group so
 * its hero can bleed full-bleed under the transparent fixed header (no main
 * top-padding). Reads live staging data; the reel + closing CTA degrade
 * gracefully when data can't be loaded.
 */
export const dynamic = "force-dynamic";

async function loadFrames(): Promise<ShopFrame[]> {
  try {
    return await getActiveFrames();
  } catch (err) {
    console.error("[home] frames load failed", err);
    return [];
  }
}

async function loadClinics(): Promise<Clinic[]> {
  try {
    return await getActiveClinics();
  } catch (err) {
    console.error("[home] clinics load failed", err);
    return [];
  }
}

export default async function Home() {
  const [frames, clinics] = await Promise.all([loadFrames(), loadClinics()]);

  return (
    <>
      <SiteHeader />
      <main>
        <ImmersiveHero />
        <Manifesto />
        <TwoPaths />
        <FramesReel frames={frames} />
        <LensQuizCta />
        <ClinicsCta clinics={clinics} />
      </main>
      <SiteFooter />
    </>
  );
}
