import Link from "next/link";
import { SiteHeader } from "@/components/organisms/site-header";
import { SiteFooter } from "@/components/organisms/site-footer";

/**
 * Home page — lives outside the (marketing) route group so it doesn't
 * conflict with (marketing)/page.tsx. The marketing layout (SiteHeader +
 * SiteFooter) is included explicitly here; shop/clinics/etc. get it via the
 * (marketing) group layout.
 */
export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-lumen-sage">
            Lumen Eye Care
          </p>
          <h1 className="font-display text-5xl leading-tight text-lumen-ink sm:text-6xl">
            Premium eyewear,{" "}
            <em className="italic text-lumen-blue">designed in Ghana</em>.
          </h1>
          <p className="max-w-md text-balance text-lumen-ink/70">
            Italian acetate, Japanese titanium, Swiss lenses. Our inaugural
            frames collection is here.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-md bg-lumen-blue px-6 py-3 text-sm font-medium text-lumen-cream transition-colors hover:bg-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
          >
            Shop frames
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
