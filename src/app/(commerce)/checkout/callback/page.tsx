import type { Metadata } from "next";
import { SiteHeader } from "@/components/organisms/site-header";
import { SiteFooter } from "@/components/organisms/site-footer";
import { requireUser } from "@/server/auth-guards";
import { CallbackView } from "./callback-view";

export const metadata: Metadata = {
  title: "Confirming payment",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

/**
 * Paystack `callback_url` lands here after MoMo/card. The webhook is the source
 * of truth; this page polls the order status (updated by the webhook) and routes
 * to success/failure. Requires sign-in like the rest of checkout.
 */
export default async function CheckoutCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;
  const reference = sp.reference ?? sp.trxref ?? null;

  return (
    <>
      <SiteHeader />
      <div style={{ paddingTop: "var(--nav-h)" }}>
        <CallbackView reference={reference} />
      </div>
      <SiteFooter />
    </>
  );
}
