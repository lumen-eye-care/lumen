"use client";

/**
 * Category tabs for the /shop hero (Optical / Sunglasses / Contact lenses).
 * Updates `cat` searchParam via URL replace; backed by FrameCategory data
 * from the DB (so Charity can add new categories without a code change).
 */

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Icon } from "@/components/atoms/icon";
import { buildShopUrl, type ParsedShopParams } from "@/lib/shop-filters";
import type { FrameCategory } from "@/server/frames";
import type { IconName } from "@/components/atoms/icon";

const CATEGORY_ICONS: Record<string, IconName> = {
  optical: "glasses",
  sun: "sun",
  contacts: "drop",
};

type ShopTabsProps = {
  categories: FrameCategory[];
  params: ParsedShopParams;
};

export function ShopTabs({ categories, params }: ShopTabsProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function navigate(cat: string) {
    // Switching category resets all facet filters — avoids confusing empty states
    const url = buildShopUrl(
      {
        ...params,
        shapes: [],
        genders: [],
        materials: [],
        colours: [],
        minGhs: null,
        maxGhs: null,
      },
      { cat },
    );
    startTransition(() => router.replace(url, { scroll: false }));
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label="Frame categories"
    >
      {categories.map((cat) => {
        const active = params.cat === cat.slug;
        const iconName = CATEGORY_ICONS[cat.slug] ?? "glasses";
        return (
          <button
            key={cat.slug}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => navigate(cat.slug)}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
            style={
              active
                ? { background: "var(--lm-text)", color: "var(--lm-base)" }
                : {
                    background: "var(--lm-surface)",
                    color: "var(--lm-text)",
                    border: "1px solid var(--lm-hair)",
                  }
            }
          >
            <Icon name={iconName} size={14} />
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
