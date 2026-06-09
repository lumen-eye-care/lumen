"use client";

/**
 * The filter controls themselves (shape / gender / material / colour / price +
 * clear-all). Shared by the desktop sidebar (ShopFilters) and the mobile filter
 * drawer (MobileFilterBar) so the markup lives in exactly one place.
 *
 * Reads current state from props (parsed by the Server Component) and writes
 * back via router.replace — the URL stays the single source of truth.
 */

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FilterGroup } from "@/components/molecules/filter-group";
import {
  buildShopUrl,
  countActiveFilters,
  MATERIAL_OPTIONS,
  COLOUR_OPTIONS,
  type ParsedShopParams,
  type FacetCounts,
} from "@/lib/shop-filters";
import { FRAME_SHAPES, FRAME_GENDERS } from "@/lib/frame-schemas";

const SHAPE_LABELS: Record<string, string> = {
  round: "Round",
  square: "Square",
  cateye: "Cat-eye",
  aviator: "Aviator",
  oval: "Oval",
  hex: "Geometric",
};

const GENDER_LABELS: Record<string, string> = {
  women: "Women",
  men: "Men",
  unisex: "Unisex",
};

type FilterPanelProps = {
  params: ParsedShopParams;
  facets: FacetCounts;
};

export function FilterPanel({ params, facets }: FilterPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const activeFilterCount = countActiveFilters(params);

  function navigate(update: Partial<ParsedShopParams>) {
    const url = buildShopUrl(params, update);
    startTransition(() => router.replace(url, { scroll: false }));
  }

  function toggleList<T extends string>(
    current: T[],
    value: T,
    key: keyof ParsedShopParams,
  ) {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    navigate({ [key]: next } as Partial<ParsedShopParams>);
  }

  function clearAll() {
    navigate({
      shapes: [],
      genders: [],
      materials: [],
      colours: [],
      minGhs: null,
      maxGhs: null,
    });
  }

  return (
    <div
      className={`transition-opacity duration-200 ${isPending ? "opacity-40 pointer-events-none" : ""}`}
      aria-busy={isPending}
    >
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="mb-4 flex w-full items-center justify-between rounded-md bg-lumen-ink/5 px-3 py-2 text-xs font-medium text-lumen-ink transition-colors hover:bg-lumen-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
        >
          Clear all filters
          <span className="rounded-full bg-lumen-blue/15 px-1.5 py-0.5 text-[10px] font-semibold text-lumen-blue">
            {activeFilterCount}
          </span>
        </button>
      )}

      {/* Frame shape */}
      <FilterGroup title="Frame shape">
        {FRAME_SHAPES.map((shape) => {
          const count = facets.shapes[shape] ?? 0;
          const checked = params.shapes.includes(shape);
          return (
            <label
              key={shape}
              className="flex cursor-pointer items-center justify-between gap-2 text-sm text-lumen-ink"
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleList(params.shapes, shape, "shapes")}
                  className="h-4 w-4 rounded border-lumen-ink/20 text-lumen-blue accent-lumen-blue"
                />
                {SHAPE_LABELS[shape] ?? shape}
              </span>
              <span className="text-xs text-lumen-ink/40">{count}</span>
            </label>
          );
        })}
      </FilterGroup>

      {/* Gender */}
      <FilterGroup title="Gender">
        {FRAME_GENDERS.map((gender) => {
          const count = facets.genders[gender] ?? 0;
          const checked = params.genders.includes(gender);
          return (
            <label
              key={gender}
              className="flex cursor-pointer items-center justify-between gap-2 text-sm text-lumen-ink"
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleList(params.genders, gender, "genders")}
                  className="h-4 w-4 rounded border-lumen-ink/20 accent-lumen-blue"
                />
                {GENDER_LABELS[gender] ?? gender}
              </span>
              <span className="text-xs text-lumen-ink/40">{count}</span>
            </label>
          );
        })}
      </FilterGroup>

      {/* Material */}
      <FilterGroup title="Material">
        {MATERIAL_OPTIONS.map((m) => {
          const count = facets.materials[m.id] ?? 0;
          const checked = params.materials.includes(m.id);
          return (
            <label
              key={m.id}
              className="flex cursor-pointer items-center justify-between gap-2 text-sm text-lumen-ink"
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleList(params.materials, m.id, "materials")}
                  className="h-4 w-4 rounded border-lumen-ink/20 accent-lumen-blue"
                />
                {m.label}
              </span>
              <span className="text-xs text-lumen-ink/40">{count}</span>
            </label>
          );
        })}
      </FilterGroup>

      {/* Colour swatches */}
      <FilterGroup title="Colour">
        <div className="grid grid-cols-8 gap-2">
          {COLOUR_OPTIONS.map((c) => {
            const count = facets.colours[c.name] ?? 0;
            const active = params.colours.includes(c.name);
            return (
              <button
                key={c.name}
                type="button"
                title={`${c.name}${count > 0 ? ` (${count})` : ""}`}
                aria-pressed={active}
                onClick={() => toggleList(params.colours, c.name, "colours")}
                disabled={count === 0}
                className={[
                  "h-7 w-7 rounded-full ring-offset-2 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue",
                  active
                    ? "ring-2 ring-lumen-blue"
                    : "ring-1 ring-lumen-ink/15",
                  count === 0
                    ? "opacity-25 cursor-not-allowed"
                    : "hover:scale-110 cursor-pointer",
                ].join(" ")}
                style={{ backgroundColor: c.hex }}
              />
            );
          })}
        </div>
      </FilterGroup>

      {/* Price range */}
      <FilterGroup title="Price range (₵)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            min={0}
            value={params.minGhs ?? ""}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              navigate({ minGhs: Number.isFinite(v) && v >= 0 ? v : null });
            }}
            className="w-full rounded-md border border-lumen-ink/15 bg-transparent px-3 py-1.5 text-sm text-lumen-ink placeholder:text-lumen-ink/30 focus:border-lumen-blue focus:outline-none"
          />
          <span className="shrink-0 text-xs text-lumen-ink/40">to</span>
          <input
            type="number"
            placeholder="Max"
            min={0}
            value={params.maxGhs ?? ""}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              navigate({ maxGhs: Number.isFinite(v) && v > 0 ? v : null });
            }}
            className="w-full rounded-md border border-lumen-ink/15 bg-transparent px-3 py-1.5 text-sm text-lumen-ink placeholder:text-lumen-ink/30 focus:border-lumen-blue focus:outline-none"
          />
        </div>
      </FilterGroup>
    </div>
  );
}
