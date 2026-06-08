import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/organisms/site-header";
import { SiteFooter } from "@/components/organisms/site-footer";
import { Icon } from "@/components/atoms/icon";

export const metadata: Metadata = {
  title: "Your Bag",
};

/**
 * Cart stub — US-P0-03 / US-P0-05/06/07 build the real cart + checkout.
 * The header cart icon navigates here so there's no 404.
 * Sits in (commerce) outside the (marketing) layout, so
 * SiteHeader + SiteFooter are included explicitly.
 */
export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-5 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lumen-ink/5 text-lumen-ink/30">
          <Icon name="cart" size={24} strokeWidth={1} />
        </div>
        <h1 className="font-display text-3xl text-lumen-ink">Your bag</h1>
        <p className="text-sm text-lumen-ink/50">
          Checkout is coming soon. In the meantime, browse our frames and{" "}
          <a
            href="https://wa.me/233245628432"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lumen-blue underline-offset-2 hover:underline"
          >
            WhatsApp us
          </a>{" "}
          to place an order.
        </p>
        <Link
          href="/shop"
          className="mt-2 inline-flex items-center gap-2 rounded-md bg-lumen-blue px-5 py-2.5 text-sm font-medium text-lumen-cream transition-colors hover:bg-lumen-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
        >
          Continue shopping
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
