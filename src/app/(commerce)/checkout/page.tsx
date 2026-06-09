import type { Metadata } from "next";
import { SiteHeader } from "@/components/organisms/site-header";
import { SiteFooter } from "@/components/organisms/site-footer";
import { requireUser } from "@/server/auth-guards";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
};

// Always run server-side: this is per-user and must never be cached.
export const dynamic = "force-dynamic";

/**
 * Checkout (US-P0-05/06/07). v1 requires sign-in — requireUser() redirects to
 * /sign-in?redirect=/checkout otherwise. The bag itself lives client-side, so the
 * interactive form is a Client Component; this wrapper enforces auth + chrome.
 */
export default async function CheckoutPage() {
  await requireUser();
  return (
    <>
      <SiteHeader />
      <CheckoutForm />
      <SiteFooter />
    </>
  );
}
