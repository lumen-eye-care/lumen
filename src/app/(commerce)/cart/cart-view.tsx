"use client";

import Link from "next/link";
import { EmptyState } from "@/components/atoms/empty-state";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { formatGhs } from "@/lib/format-money";
import { cartItemKey } from "@/lib/cart";
import { useCart } from "@/components/cart/cart-provider";

export function CartView() {
  const { items, count, subtotalPesewa, hydrated, clear } = useCart();

  // Avoid an empty-flash before localStorage is read.
  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="h-8 w-40 animate-pulse rounded bg-lumen-ink/8" />
        <div className="mt-8 space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-20 w-20 animate-pulse rounded-lg bg-lumen-ink/8" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-1/2 animate-pulse rounded bg-lumen-ink/8" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-lumen-ink/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-6 py-16">
        <EmptyState
          title="Your bag is empty"
          description="Browse the collection and add a frame — your picks show up here."
          cta={{ label: "Shop the collection", href: "/shop" }}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 flex items-end justify-between">
        <h1 className="font-display text-3xl text-lumen-ink">
          Your bag <span className="text-lumen-ink/40">· {count}</span>
        </h1>
        <button
          type="button"
          onClick={clear}
          className="text-sm text-lumen-ink/50 underline-offset-2 transition-colors hover:text-lumen-warm hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
        >
          Clear bag
        </button>
      </div>

      <div className="divide-y divide-lumen-ink/8 border-y border-lumen-ink/8">
        {items.map((item) => (
          <CartLineItem key={cartItemKey(item)} item={item} />
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 rounded-xl border border-lumen-ink/8 bg-white p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-lumen-ink/60">Subtotal</span>
          <span className="text-lg font-medium text-lumen-ink">
            {formatGhs(subtotalPesewa)}
          </span>
        </div>
        <p className="mt-1 text-xs text-lumen-ink/50">
          Lenses, delivery &amp; any extras are calculated at checkout.
        </p>

        <Link
          href="/checkout"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-lumen-blue px-5 py-3 text-sm font-medium text-lumen-cream transition-colors hover:bg-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
        >
          Checkout
        </Link>
      </div>
    </main>
  );
}
