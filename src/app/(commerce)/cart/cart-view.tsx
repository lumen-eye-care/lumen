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
        <div
          className="h-8 w-40 animate-pulse rounded"
          style={{ background: "var(--lm-tint)" }}
        />
        <div className="mt-8 space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3">
              <div
                className="h-20 w-20 animate-pulse rounded-lg"
                style={{ background: "var(--lm-tint)" }}
              />
              <div className="flex-1 space-y-2 py-1">
                <div
                  className="h-4 w-1/2 animate-pulse rounded"
                  style={{ background: "var(--lm-tint)" }}
                />
                <div
                  className="h-3 w-1/4 animate-pulse rounded"
                  style={{ background: "var(--lm-surface)" }}
                />
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
        <h1 className="lm-display text-3xl" style={{ color: "var(--lm-text)" }}>
          Your bag{" "}
          <span style={{ color: "var(--lm-faint)" }}>· {count}</span>
        </h1>
        <button
          type="button"
          onClick={clear}
          className="text-sm underline-offset-2 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
          style={{ color: "var(--lm-faint)" }}
        >
          Clear bag
        </button>
      </div>

      <div
        className="divide-y border-y"
        style={{ borderColor: "var(--lm-hair)", "--tw-divide-opacity": "1" } as React.CSSProperties}
      >
        {items.map((item) => (
          <CartLineItem key={cartItemKey(item)} item={item} />
        ))}
      </div>

      {/* Summary */}
      <div
        className="mt-8 rounded-xl p-5"
        style={{ border: "1px solid var(--lm-hair)", background: "var(--lm-raise)" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "var(--lm-muted)" }}>
            Subtotal
          </span>
          <span className="text-lg font-medium" style={{ color: "var(--lm-text)" }}>
            {formatGhs(subtotalPesewa)}
          </span>
        </div>
        <p className="mt-1 text-xs" style={{ color: "var(--lm-faint)" }}>
          Lenses are included above. Delivery is calculated at checkout.
        </p>

        <Link href="/checkout" className="lm-pill mt-4 w-full justify-center">
          Checkout
        </Link>
      </div>
    </main>
  );
}
