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
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-[color:var(--lm-tint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
          style={{ border: "1px solid var(--lm-hair)", color: "var(--lm-text)" }}
        >
          <Icon name="chev" size={14} className="-rotate-90" />
          Filters
          {activeFilterCount > 0 && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none"
              style={{ background: "var(--lm-warm)", color: "#1a0f0a" }}
            >
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
            className="fixed inset-0 z-40 backdrop-blur-sm"
            style={{ background: "rgba(5,15,27,0.45)" }}
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[90vw] flex-col shadow-xl"
            style={{ background: "var(--lm-base)" }}
            role="dialog"
            aria-label="Filters"
            aria-modal="true"
          >
            <div
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: "var(--lm-hair)" }}
            >
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--lm-text)" }}
              >
                Filters
                {activeFilterCount > 0 && (
                  <span
                    className="ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ background: "var(--lm-tint)", color: "var(--lm-warm)" }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-[color:var(--lm-tint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
                style={{ color: "var(--lm-muted)" }}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-2">
              <FilterPanel params={params} facets={facets} />
            </div>
            <div className="border-t p-4" style={{ borderColor: "var(--lm-hair)" }}>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="lm-pill w-full justify-center"
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
