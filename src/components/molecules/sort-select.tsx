"use client";

/**
 * Sort dropdown — shared by the desktop toolbar (ShopToolbar) and the mobile
 * filter/sort bar (MobileFilterBar). Writes the chosen sort to the URL.
 */

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  buildShopUrl,
  SHOP_SORT_OPTIONS,
  type ParsedShopParams,
  type ShopSort,
} from "@/lib/shop-filters";

export function SortSelect({
  params,
  className = "",
}: {
  params: ParsedShopParams;
  className?: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function setSort(sort: ShopSort) {
    const url = buildShopUrl(params, { sort });
    startTransition(() => router.replace(url, { scroll: false }));
  }

  return (
    <label className={`flex items-center gap-2 text-sm text-lumen-ink/70 ${className}`}>
      Sort:
      <select
        value={params.sort}
        onChange={(e) => setSort(e.target.value as ShopSort)}
        className="rounded-md border border-lumen-ink/15 bg-transparent py-1.5 pl-2 pr-6 text-sm text-lumen-ink focus:border-lumen-blue focus:outline-none"
      >
        {SHOP_SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
