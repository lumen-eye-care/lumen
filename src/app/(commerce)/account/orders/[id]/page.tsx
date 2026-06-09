import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import { formatGhs } from "@/lib/format-money";
import { OrderStatusPill } from "@/components/molecules/order-status-pill";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

type Item = {
  id: string;
  quantity: number;
  price_ghs: number;
  color_selected: string | null;
  frames: { name: string; slug: string } | null;
};

const dateFmt = new Intl.DateTimeFormat("en-GH", {
  dateStyle: "medium",
  timeStyle: "short",
});

const METHOD_LABEL: Record<string, string> = {
  momo: "Mobile money",
  card: "Card",
  cod: "Pay on delivery",
};

/**
 * US-P0-08 — customer order detail. RLS (`orders read own`) means a non-owner's
 * id returns no row → notFound(); the same path covers a genuinely missing id, so
 * we never disclose another customer's order even exists. Delivery snapshot is
 * read from the order's own columns (no users join — customers see their own).
 */
export default async function MyOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, payment_reference, status, total_ghs, payment_method, delivery_type, delivery_name, delivery_phone, delivery_city, delivery_address, delivery_landmark, created_at, order_items(id, quantity, price_ghs, color_selected, frames(name, slug))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const items = (order.order_items ?? []) as unknown as Item[];
  const ref = order.payment_reference ?? `Order ${order.id.slice(0, 8)}`;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-3xl text-lumen-ink">{ref}</h1>
          <p className="text-sm text-lumen-ink/55">
            Placed {dateFmt.format(new Date(order.created_at))}
          </p>
          <OrderStatusPill status={order.status} />
        </div>
        <Link
          href="/account/orders"
          className="shrink-0 text-sm text-lumen-blue underline-offset-2 hover:underline"
        >
          ← All orders
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-lumen-ink/10 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-lumen-ink/60">
            Items
          </h2>
          <ul className="flex flex-col gap-3">
            {items.map((it) => (
              <li key={it.id} className="flex justify-between gap-3 text-sm">
                <span className="text-lumen-ink/80">
                  {it.frames?.name ?? "Frame"}
                  {it.color_selected && ` · ${it.color_selected}`}
                  {it.quantity > 1 && (
                    <span className="text-lumen-ink/50"> × {it.quantity}</span>
                  )}
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
        </section>

        <aside className="flex flex-col gap-6">
          <section className="rounded-xl border border-lumen-ink/10 bg-white p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-lumen-ink/60">
              Payment
            </h2>
            <dl className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-lumen-ink/60">Method</dt>
                <dd className="text-lumen-ink">
                  {order.payment_method
                    ? (METHOD_LABEL[order.payment_method] ?? order.payment_method)
                    : "—"}
                </dd>
              </div>
              {order.payment_reference && (
                <div className="flex justify-between gap-3">
                  <dt className="text-lumen-ink/60">Reference</dt>
                  <dd className="text-lumen-ink">{order.payment_reference}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-xl border border-lumen-ink/10 bg-white p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-lumen-ink/60">
              Delivery
            </h2>
            <div className="flex flex-col gap-1 text-sm text-lumen-ink/80">
              {order.delivery_name && <span>{order.delivery_name}</span>}
              {order.delivery_phone && <span>{order.delivery_phone}</span>}
              {order.delivery_address && <span>{order.delivery_address}</span>}
              {order.delivery_landmark && (
                <span className="text-lumen-ink/55">
                  Near {order.delivery_landmark}
                </span>
              )}
              {order.delivery_city && <span>{order.delivery_city}</span>}
              {!order.delivery_name &&
                !order.delivery_address &&
                !order.delivery_city && (
                  <span className="text-lumen-ink/50">
                    No delivery details on file.
                  </span>
                )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
