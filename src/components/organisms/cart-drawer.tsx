"use client";

/**
 * Global slide-over bag. Mounted once at the app root so it overlays every
 * route. Open state lives in the cart context (cart.open() on add-to-bag).
 *
 * A11y: role="dialog" + aria-modal, ESC to close, focus moved into the panel on
 * open and restored on close, basic Tab focus-trap, body scroll lock while open.
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "@/components/atoms/icon";
import { EmptyState } from "@/components/atoms/empty-state";
import { formatGhs } from "@/lib/format-money";
import { cartItemKey } from "@/lib/cart";
import { useCart } from "@/components/cart/cart-provider";
import { CartLineItem } from "@/components/cart/cart-line-item";

export function CartDrawer() {
  const { items, count, subtotalPesewa, isOpen, close } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  // Lock body scroll, remember/restore focus, and move focus into the panel.
  useEffect(() => {
    if (!isOpen) return;
    lastFocused.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      lastFocused.current?.focus?.();
    };
  }, [isOpen]);

  // ESC to close + simple Tab focus-trap within the panel.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      {/* Overlay */}
      <button
        type="button"
        aria-label="Close bag"
        onClick={close}
        className="absolute inset-0 h-full w-full cursor-default bg-lumen-ink/40 backdrop-blur-[1px]"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-lumen-cream shadow-[0_0_40px_rgba(10,31,53,0.25)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-lumen-ink/8 px-5 py-4">
          <h2 className="font-display text-xl text-lumen-ink">
            Your bag{count > 0 && <span className="text-lumen-ink/40"> · {count}</span>}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={close}
            aria-label="Close bag"
            className="flex h-9 w-9 items-center justify-center rounded-md text-lumen-ink/60 transition-colors hover:bg-lumen-ink/5 hover:text-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              title="Your bag is empty"
              description="Browse the collection and add a frame to get started."
              action={{ label: "Continue shopping", onClick: close }}
            />
          </div>
        ) : (
          <>
            {/* Line items */}
            <div className="min-h-0 flex-1 divide-y divide-lumen-ink/8 overflow-y-auto px-5">
              {items.map((item) => (
                <CartLineItem key={cartItemKey(item)} item={item} compact />
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-lumen-ink/8 px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-lumen-ink/60">Subtotal</span>
                <span className="text-lg font-medium text-lumen-ink">
                  {formatGhs(subtotalPesewa)}
                </span>
              </div>
              <p className="mb-3 text-xs text-lumen-ink/50">
                Lenses, delivery &amp; any extras are calculated at checkout.
              </p>

              {/* Checkout is deferred to the commerce-funnel story. */}
              <button
                type="button"
                disabled
                title="Checkout coming soon"
                className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md bg-lumen-blue/40 px-5 py-3 text-sm font-medium text-lumen-cream"
              >
                Checkout — coming soon
              </button>
              <Link
                href="/cart"
                onClick={close}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-lumen-ink/15 px-5 py-2.5 text-sm font-medium text-lumen-ink transition-colors hover:border-lumen-ink/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
              >
                View full bag
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
