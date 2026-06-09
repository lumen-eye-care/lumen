"use client";

/**
 * Mobile-only control bar: Filters trigger + Sort on a single full-width row
 * above the grid (lg:hidden). Replaces the old desktop-sidebar-leak layout that
 * stole horizontal space from the card grid on phones. The filter drawer reuses
 * the shared <FilterPanel>.
 */

import { useState } from "react";
import { Icon } from "@/components/atoms/icon";
import { FilterPanel } from "@/components/organisms/filter-panel";
import { SortSelect } from "@/components/molecules/sort-select";
import {
  countActiveFilters,
  type ParsedShopParams,
  type FacetCounts,
} from "@/lib/shop-filters";

type MobileFilterBarProps = {
  params: ParsedShopParams;
  facets: FacetCounts;
};

export function MobileFilterBar({ params, facets }: MobileFilterBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeFilterCount = countActiveFilters(params);

  return (
    <div className="lg:hidden">
      {/* Filters + Sort, one row */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 rounded-md border border-lumen-ink/15 px-3 py-2 text-sm text-lumen-ink transition-colors hover:bg-lumen-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
        >
          <Icon name="chev" size={14} className="-rotate-90" />
          Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-lumen-blue px-1.5 py-0.5 text-[10px] font-semibold leading-none text-lumen-cream">
              {activeFilterCount}
            </span>
          )}
        </button>

        <SortSelect params={params} />
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-lumen-ink/30 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[90vw] flex-col bg-lumen-cream shadow-xl"
            role="dialog"
            aria-label="Filters"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-lumen-ink/8 px-5 py-4">
              <span className="text-sm font-semibold text-lumen-ink">
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 rounded-full bg-lumen-blue/15 px-1.5 py-0.5 text-[10px] font-semibold text-lumen-blue">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="flex h-8 w-8 items-center justify-center rounded-md text-lumen-ink/60 hover:bg-lumen-ink/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-2">
              <FilterPanel params={params} facets={facets} />
            </div>
            <div className="border-t border-lumen-ink/8 p-4">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-full rounded-md bg-lumen-blue py-2.5 text-sm font-medium text-lumen-cream transition-colors hover:bg-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
              >
                View results
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
