import type { Metadata } from "next";
import Link from "next/link";
import { getActiveCategories, getActiveFrames } from "@/server/frames";
import { parseShopParams, applyShopFilters } from "@/lib/shop-filters";
import { FrameCard } from "@/components/molecules/frame-card";
import { ShopFilters } from "@/components/organisms/shop-filters";
import { ShopToolbar } from "@/components/organisms/shop-toolbar";
import { ShopTabs } from "@/components/organisms/shop-tabs";
import { Icon } from "@/components/atoms/icon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop Frames",
  description:
    "Browse Lumen's inaugural frames collection — Italian acetate, Japanese titanium, Swiss lenses.",
};

type ShopPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const rawParams = await searchParams;
  const params = parseShopParams(rawParams);

  const [categories, allFrames] = await Promise.all([
    getActiveCategories(),
    getActiveFrames(params.cat !== "contacts" ? params.cat : undefined),
  ]);

  const activeCategory = categories.find((c) => c.slug === params.cat);
  const { filtered, total, facets } = applyShopFilters(allFrames, params);

  const heroTitle = activeCategory?.hero_title ?? "Frames, considered.";
  const heroSubtitle =
    activeCategory?.hero_subtitle ??
    "Italian acetate, Japanese titanium, Swiss lenses. Chosen for fit, longevity and design integrity.";

  const isContacts = params.cat === "contacts";

  return (
    <div className="min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="border-b border-lumen-ink/8 bg-lumen-cream px-6 pb-8 pt-8">
        <div className="mx-auto max-w-[1280px]">
          {/* Breadcrumb */}
          <nav className="mb-5 flex items-center gap-1.5 text-xs text-lumen-ink/40" aria-label="Breadcrumb">
            <Link
              href="/"
              className="hover:text-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
            >
              Home
            </Link>
            <Icon name="chev" size={10} className="-rotate-90" />
            <span className="text-lumen-ink/70">Shop</span>
          </nav>

          <h1 className="mb-2 font-display text-4xl text-lumen-ink sm:text-5xl">
            {heroTitle.includes(",") ? (
              <>
                {heroTitle.split(",")[0]},&nbsp;
                <em className="italic">{heroTitle.split(",").slice(1).join(",").trim()}</em>
              </>
            ) : (
              <em className="italic">{heroTitle}</em>
            )}
          </h1>
          <p className="mb-6 max-w-xl text-sm leading-relaxed text-lumen-ink/60">
            {heroSubtitle}
          </p>

          <ShopTabs categories={categories} params={params} />
        </div>
      </section>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1280px] px-6 py-8">
        {isContacts ? (
          /* Contacts — no catalogue yet */
          <div className="mx-auto max-w-lg py-16 text-center">
            <div className="mb-4 flex justify-center text-lumen-ink/20">
              <Icon name="drop" size={48} strokeWidth={1} />
            </div>
            <h2 className="mb-3 font-display text-2xl text-lumen-ink">
              Contact lenses — fitted in clinic
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-lumen-ink/60">
              Contacts need a clinical fitting first. Book a 30-min consultation
              with an optometrist; we&apos;ll prescribe and order your trial pair
              on the same day.
            </p>
            <Link
              href="/clinics"
              className="inline-flex items-center gap-2 rounded-md bg-lumen-blue px-5 py-2.5 text-sm font-medium text-lumen-cream transition-colors hover:bg-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
            >
              Book a consultation
              <Icon name="arrow" size={14} />
            </Link>
          </div>
        ) : (
          <div className="flex items-start gap-8">
            {/* Filters sidebar */}
            <ShopFilters params={params} facets={facets} />

            {/* Main content */}
            <div className="min-w-0 flex-1">
              <ShopToolbar
                params={params}
                filteredCount={filtered.length}
                totalCount={total}
              />

              {filtered.length === 0 ? (
                /* Empty state */
                <div className="mt-12 text-center">
                  <div className="mb-4 flex justify-center text-lumen-ink/20">
                    <Icon name="search" size={40} strokeWidth={1} />
                  </div>
                  <h2 className="mb-2 font-display text-xl text-lumen-ink">
                    No frames match these filters
                  </h2>
                  <p className="mb-5 text-sm text-lumen-ink/50">
                    Try broadening your search or clearing some filters.
                  </p>
                  <Link
                    href={`/shop${params.cat !== "optical" ? `?cat=${params.cat}` : ""}`}
                    className="inline-flex items-center gap-2 rounded-md border border-lumen-ink/15 px-4 py-2 text-sm text-lumen-ink transition-colors hover:bg-lumen-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
                  >
                    Clear all filters
                  </Link>
                </div>
              ) : (
                /* Frame grid */
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {filtered.map((frame, i) => (
                    <FrameCard
                      key={frame.id}
                      frame={frame}
                      priority={i < 4}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
