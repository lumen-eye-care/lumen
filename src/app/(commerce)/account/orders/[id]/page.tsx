import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import { formatGhs } from "@/lib/format-money";
import { OrderStatusPill } from "@/components/molecules/order-status-pill";
import { OrderTracker } from "@/components/account/order-tracker";
import { isLiveOrder } from "@/lib/order-tracker";

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
 * US-P0-08 — customer order detail. Scoped to the owner explicitly: an admin's
 * `orders admin all` policy can read any order, so we filter on `user_id` too —
 * in their own account an admin sees only their own orders (others live in
 * /admin). A non-owner / missing id returns no row → notFound(), so we never
 * disclose that another customer's order exists. Delivery snapshot is read from
 * the order's own columns (no users join).
 */
export default async function MyOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, payment_reference, status, total_ghs, payment_method, delivery_type, delivery_name, delivery_phone, delivery_city, delivery_address, delivery_landmark, courier, tracking_number, created_at, order_items(id, quantity, price_ghs, color_selected, frames(name, slug))",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!order) notFound();

  const items = (order.order_items ?? []) as unknown as Item[];
  const ref = order.payment_reference ?? `Order ${order.id.slice(0, 8)}`;
  // Show the timeline for in-flight orders + delivered (completed timeline);
  // skip failed/timed-out/refunded, where a delivery timeline is meaningless.
  const showTracker = isLiveOrder(order.status) || order.status === "delivered";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="lm-display text-3xl break-words" style={{ color: "var(--lm-text)" }}>{ref}</h1>
          <p className="text-sm" style={{ color: "var(--lm-muted)" }}>
            Placed {dateFmt.format(new Date(order.created_at))}
          </p>
          <OrderStatusPill status={order.status} />
        </div>
        <Link
          href="/account/orders"
          className="shrink-0 text-sm underline-offset-2 hover:underline"
          style={{ color: "var(--lm-warm)" }}
        >
          ← All orders
        </Link>
      </header>

      {showTracker && (
        <section
          className="rounded-xl p-5"
          style={{ border: "1px solid var(--lm-hair)", background: "var(--lm-raise)" }}
        >
          <h2
            className="mb-4 text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--lm-faint)" }}
          >
            Tracking
          </h2>
          <OrderTracker status={order.status} />
          {order.status === "shipped" && (
            <p className="mt-4 text-sm" style={{ color: "var(--lm-muted)" }}>
              {order.courier
                ? `On its way with ${order.courier}.`
                : "On its way."}
              {order.tracking_number && (
                <>
                  {" "}Tracking:{" "}
                  <span className="break-all" style={{ color: "var(--lm-text)" }}>
                    {order.tracking_number}
                  </span>
                </>
              )}
            </p>
          )}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section
          className="rounded-xl p-5 lg:col-span-2"
          style={{ border: "1px solid var(--lm-hair)", background: "var(--lm-raise)" }}
        >
          <h2
            className="mb-4 text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--lm-faint)" }}
          >
            Items
          </h2>
          <ul className="flex flex-col gap-3">
            {items.map((it) => (
              <li key={it.id} className="flex justify-between gap-3 text-sm">
                <span style={{ color: "var(--lm-muted)" }}>
                  {it.frames?.name ?? "Frame"}
                  {it.color_selected && ` · ${it.color_selected}`}
                  {it.quantity > 1 && (
                    <span style={{ color: "var(--lm-faint)" }}> × {it.quantity}</span>
                  )}
                </span>
                <span className="shrink-0" style={{ color: "var(--lm-text)" }}>
                  {formatGhs(it.price_ghs * it.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div
            className="mt-4 flex items-center justify-between border-t pt-4"
            style={{ borderColor: "var(--lm-hair)" }}
          >
            <span className="text-sm" style={{ color: "var(--lm-muted)" }}>Total</span>
            <span className="text-lg font-medium" style={{ color: "var(--lm-text)" }}>
              {formatGhs(order.total_ghs)}
            </span>
          </div>
        </section>

        <aside className="flex flex-col gap-6">
          <section
            className="rounded-xl p-5"
            style={{ border: "1px solid var(--lm-hair)", background: "var(--lm-raise)" }}
          >
            <h2
              className="mb-3 text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--lm-faint)" }}
            >
              Payment
            </h2>
            <dl className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt style={{ color: "var(--lm-muted)" }}>Method</dt>
                <dd style={{ color: "var(--lm-text)" }}>
                  {order.payment_method
                    ? (METHOD_LABEL[order.payment_method] ?? order.payment_method)
                    : "—"}
                </dd>
              </div>
              {order.payment_reference && (
                <div className="flex justify-between gap-3">
                  <dt className="shrink-0" style={{ color: "var(--lm-muted)" }}>Reference</dt>
                  <dd className="min-w-0 break-all text-right" style={{ color: "var(--lm-text)" }}>
                    {order.payment_reference}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section
            className="rounded-xl p-5"
            style={{ border: "1px solid var(--lm-hair)", background: "var(--lm-raise)" }}
          >
            <h2
              className="mb-3 text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--lm-faint)" }}
            >
              Delivery
            </h2>
            <div className="flex flex-col gap-1 text-sm" style={{ color: "var(--lm-muted)" }}>
              {order.delivery_name && <span>{order.delivery_name}</span>}
              {order.delivery_phone && <span>{order.delivery_phone}</span>}
              {order.delivery_address && <span>{order.delivery_address}</span>}
              {order.delivery_landmark && (
                <span style={{ color: "var(--lm-faint)" }}>
                  Near {order.delivery_landmark}
                </span>
              )}
              {order.delivery_city && <span>{order.delivery_city}</span>}
              {!order.delivery_name &&
                !order.delivery_address &&
                !order.delivery_city && (
                  <span style={{ color: "var(--lm-faint)" }}>
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
