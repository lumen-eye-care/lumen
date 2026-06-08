"use client";

/**
 * Shop toolbar — result count, sort selector, active filter chips.
 * Mounted inside the /shop page alongside the grid; writes to URL on change.
 */

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Icon } from "@/components/atoms/icon";
import {
  buildShopUrl,
  SHOP_SORT_OPTIONS,
  MATERIAL_OPTIONS,
  type ParsedShopParams,
  type ShopSort,
} from "@/lib/shop-filters";

type ShopToolbarProps = {
  params: ParsedShopParams;
  filteredCount: number;
  totalCount: number;
};

export function ShopToolbar({
  params,
  filteredCount,
  totalCount,
}: ShopToolbarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(update: Partial<ParsedShopParams>) {
    const url = buildShopUrl(params, update);
    startTransition(() => router.replace(url, { scroll: false }));
  }

  const activeChips: { label: string; onRemove: () => void }[] = [
    ...params.shapes.map((s) => ({
      label: `Shape: ${s}`,
      onRemove: () =>
        navigate({ shapes: params.shapes.filter((v) => v !== s) }),
    })),
    ...params.genders.map((g) => ({
      label: g.charAt(0).toUpperCase() + g.slice(1),
      onRemove: () =>
        navigate({ genders: params.genders.filter((v) => v !== g) }),
    })),
    ...params.materials.map((m) => ({
      label:
        MATERIAL_OPTIONS.find((o) => o.id === m)?.label ?? m,
      onRemove: () =>
        navigate({ materials: params.materials.filter((v) => v !== m) }),
    })),
    ...params.colours.map((c) => ({
      label: c,
      onRemove: () =>
        navigate({ colours: params.colours.filter((v) => v !== c) }),
    })),
    ...(params.minGhs !== null
      ? [
          {
            label: `From ₵${params.minGhs}`,
            onRemove: () => navigate({ minGhs: null }),
          },
        ]
      : []),
    ...(params.maxGhs !== null
      ? [
          {
            label: `Up to ₵${params.maxGhs}`,
            onRemove: () => navigate({ maxGhs: null }),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Count + sort row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-lumen-ink/60">
          Showing{" "}
          <span className="font-medium text-lumen-ink">{filteredCount}</span>
          {filteredCount !== totalCount && (
            <>
              {" "}
              of{" "}
              <span className="font-medium text-lumen-ink">{totalCount}</span>
            </>
          )}{" "}
          {totalCount === 1 ? "frame" : "frames"}
          {isPending && (
            <span className="ml-2 text-lumen-ink/30 text-xs">Updating…</span>
          )}
        </p>

        <label className="flex items-center gap-2 text-sm text-lumen-ink/70">
          Sort:
          <select
            value={params.sort}
            onChange={(e) => navigate({ sort: e.target.value as ShopSort })}
            className="rounded-md border border-lumen-ink/15 bg-transparent py-1.5 pl-2 pr-6 text-sm text-lumen-ink focus:border-lumen-blue focus:outline-none"
          >
            {SHOP_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2" role="list" aria-label="Active filters">
          {activeChips.map((chip) => (
            <span
              key={chip.label}
              role="listitem"
              className="flex items-center gap-1.5 rounded-full border border-lumen-ink/15 bg-white px-3 py-1 text-xs text-lumen-ink"
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={`Remove filter: ${chip.label}`}
                className="flex h-4 w-4 items-center justify-center rounded-full text-lumen-ink/40 transition-colors hover:bg-lumen-ink/10 hover:text-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
              >
                <Icon name="x" size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
