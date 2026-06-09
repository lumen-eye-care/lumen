import type { Metadata } from "next";
import { SiteHeader } from "@/components/organisms/site-header";
import { SiteFooter } from "@/components/organisms/site-footer";
import { CartView } from "./cart-view";

export const metadata: Metadata = {
  title: "Your Bag",
};

/**
 * Full bag page (US-P0-03). The cart lives client-side, so the line items +
 * totals render in <CartView> ("use client"); this server wrapper keeps the
 * page metadata and the marketing chrome (it sits outside the (marketing)
 * route group, so SiteHeader/SiteFooter are included explicitly).
 */
export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <CartView />
      <SiteFooter />
    </>
  );
}
