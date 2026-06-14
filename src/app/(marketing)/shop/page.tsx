import type { Metadata } from "next";
import Link from "next/link";
import { getActiveCategories, getActiveFrames } from "@/server/frames";
import { parseShopParams, applyShopFilters } from "@/lib/shop-filters";
import { FrameCard } from "@/components/molecules/frame-card";
import { ShopFilters } from "@/components/organisms/shop-filters";
import { MobileFilterBar } from "@/components/organisms/mobile-filter-bar";
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
      <section
        className="lm-grain relative overflow-hidden border-b px-6 pb-10 pt-12"
        style={{
          borderColor: "var(--lm-hair)",
          background:
            "radial-gradient(120% 140% at 80% 0%, var(--lm-raise) 0%, var(--lm-base) 55%)",
        }}
      >
        <div className="relative z-10 mx-auto max-w-[1280px]">
          {/* Breadcrumb */}
          <nav
            className="mb-5 flex items-center gap-1.5 text-xs"
            style={{ color: "var(--lm-faint)" }}
            aria-label="Breadcrumb"
          >
            <Link
              href="/"
              className="transition-colors hover:text-[color:var(--lm-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
            >
              Home
            </Link>
            <Icon name="chev" size={10} className="-rotate-90" />
            <span style={{ color: "var(--lm-muted)" }}>Shop</span>
          </nav>

          <p className="lm-label">The collection</p>
          <h1
            className="lm-display mt-3"
            style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}
          >
            {heroTitle.includes(",") ? (
              <>
                {heroTitle.split(",")[0]},&nbsp;
                <em style={{ fontStyle: "italic", color: "var(--lm-warm)" }}>
                  {heroTitle.split(",").slice(1).join(",").trim()}
                </em>
              </>
            ) : (
              <em style={{ fontStyle: "italic", color: "var(--lm-warm)" }}>
                {heroTitle}
              </em>
            )}
          </h1>
          <p
            className="mb-7 mt-3 max-w-xl text-sm leading-relaxed"
            style={{ color: "var(--lm-muted)" }}
          >
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
            <div
              className="mb-4 flex justify-center"
              style={{ color: "var(--lm-faint)" }}
            >
              <Icon name="drop" size={48} strokeWidth={1} />
            </div>
            <h2 className="lm-display mb-3 text-2xl">
              Contact lenses — fitted in clinic
            </h2>
            <p
              className="mb-6 text-sm leading-relaxed"
              style={{ color: "var(--lm-muted)" }}
            >
              Contacts need a clinical fitting first. Book a 30-min consultation
              with an optometrist; we&apos;ll prescribe and order your trial pair
              on the same day.
            </p>
            <Link href="/book" className="lm-pill mx-auto">
              Book a consultation
              <Icon name="arrow" size={14} />
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile: Filters + Sort on one full-width row above the grid.
                Hidden from lg up, where the sidebar + toolbar take over. */}
            <MobileFilterBar params={params} facets={facets} />

            <div className="lg:flex lg:items-start lg:gap-8">
              {/* Filters sidebar (desktop only) */}
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
                  <div
                    className="mb-4 flex justify-center"
                    style={{ color: "var(--lm-faint)" }}
                  >
                    <Icon name="search" size={40} strokeWidth={1} />
                  </div>
                  <h2 className="lm-display mb-2 text-xl">
                    No frames match these filters
                  </h2>
                  <p
                    className="mb-5 text-sm"
                    style={{ color: "var(--lm-muted)" }}
                  >
                    Try broadening your search or clearing some filters.
                  </p>
                  <Link
                    href={`/shop${params.cat !== "optical" ? `?cat=${params.cat}` : ""}`}
                    className="lm-ghost mx-auto"
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
          </>
        )}
      </div>
    </div>
  );
}
