"use client";

/**
 * Clears the browser bag when the authenticated user changes, so one person's
 * cart never leaks to the next account in the same browser (the bag is global
 * localStorage with no auth scoping of its own). Renders nothing.
 *
 * The decision is pure (`decideCartOnAuth`); this component only wires it to the
 * Supabase auth stream and the cart. `onAuthStateChange` fires INITIAL_SESSION on
 * subscribe, so a post-sign-out page load (server `signOut` clears the cookie and
 * redirects) is handled the same way — the null session clears the stale bag.
 */

import { useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useCart } from "@/components/cart/cart-provider";
import { CART_OWNER_KEY, decideCartOnAuth } from "@/lib/cart";

export function CartAuthSync() {
  const { clear } = useCart();

  useEffect(() => {
    // Supabase env is absent in some builds (e.g. the Lighthouse CI build, which
    // builds without secrets). Skip rather than let createBrowserClient throw at
    // the root and tear the client tree down — mirrors the guard in proxy.ts.
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ) {
      return;
    }

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const prevOwner = localStorage.getItem(CART_OWNER_KEY);
      const { clear: shouldClear, nextOwner } = decideCartOnAuth(
        prevOwner,
        session?.user?.id ?? null,
      );

      if (shouldClear) clear();
      if (nextOwner) localStorage.setItem(CART_OWNER_KEY, nextOwner);
      else localStorage.removeItem(CART_OWNER_KEY);
    });

    return () => subscription.unsubscribe();
  }, [clear]);

  return null;
}
