import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/organisms/site-header";
import { SiteFooter } from "@/components/organisms/site-footer";
import { requireUser } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import { formatGhs } from "@/lib/format-money";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

type OrderItemRow = {
  quantity: number;
  color_selected: string | null;
  price_ghs: number;
  frames: { name: string } | { name: string }[] | null;
};

function frameName(frames: OrderItemRow["frames"]): string {
  if (!frames) return "Frame";
  return Array.isArray(frames) ? (frames[0]?.name ?? "Frame") : frames.name;
}

const STATUS_COPY: Record<string, { title: string; body: string }> = {
  paid: {
    title: "Payment confirmed",
    body: "Thank you — your payment is confirmed and we're preparing your frames.",
  },
  cod_pending: {
    title: "Order placed",
    body: "Thank you — you've chosen to pay on delivery. We'll be in touch to arrange delivery.",
  },
  pending: {
    title: "Order received",
    body: "We're still confirming your payment. You'll get an email once it's confirmed.",
  },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await requireUser();
  const { id } = await searchParams;
  if (!id) notFound();

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, total_ghs, payment_method, payment_reference, delivery_name, delivery_city, order_items(quantity, color_selected, price_ghs, frames(name))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const items = (order.order_items ?? []) as OrderItemRow[];
  const copy = STATUS_COPY[order.status] ?? STATUS_COPY.pending;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-2xl border border-lumen-ink/8 bg-white p-8 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-lumen-sage/15 text-lumen-sage">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M20 6 9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="font-display text-3xl text-lumen-ink">{copy.title}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-lumen-ink/60">{copy.body}</p>
          {order.payment_reference && (
            <p className="mt-3 text-xs text-lumen-ink/45">
              Order reference: <span className="font-medium">{order.payment_reference}</span>
            </p>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-lumen-ink/8 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-lumen-ink/60">
            Summary
          </h2>
          <ul className="space-y-3">
            {items.map((it, idx) => (
              <li key={idx} className="flex justify-between gap-3 text-sm">
                <span className="text-lumen-ink/80">
                  {frameName(it.frames)}
                  {it.color_selected && ` · ${it.color_selected}`}
                  {it.quantity > 1 && <span className="text-lumen-ink/50"> × {it.quantity}</span>}
                </span>
                <span className="shrink-0 text-lumen-ink">
                  {formatGhs(it.price_ghs * it.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-lumen-ink/8 pt-4">
            <span className="text-sm text-lumen-ink/60">Total</span>
            <span className="text-lg font-medium text-lumen-ink">
              {formatGhs(order.total_ghs)}
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/account/orders"
            className="rounded-md bg-lumen-blue px-5 py-2.5 text-sm font-medium text-lumen-cream transition-colors hover:bg-lumen-ink"
          >
            View my orders
          </Link>
          <Link
            href="/shop"
            className="rounded-md border border-lumen-ink/15 px-5 py-2.5 text-sm font-medium text-lumen-ink transition-colors hover:border-lumen-ink/40"
          >
            Continue shopping
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
