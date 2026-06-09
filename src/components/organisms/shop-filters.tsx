/**
 * Desktop filter sidebar. On mobile the same controls live in the slide-in
 * drawer rendered by <MobileFilterBar>; both share <FilterPanel>, so the filter
 * markup is defined once.
 */

import { FilterPanel } from "@/components/organisms/filter-panel";
import type { ParsedShopParams, FacetCounts } from "@/lib/shop-filters";

type ShopFiltersProps = {
  params: ParsedShopParams;
  facets: FacetCounts;
};

export function ShopFilters({ params, facets }: ShopFiltersProps) {
  return (
    <aside className="hidden w-[220px] shrink-0 lg:block">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-lumen-ink/40">
        Filter
      </p>
      <FilterPanel params={params} facets={facets} />
    </aside>
  );
}
