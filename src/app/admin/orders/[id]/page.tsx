import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import { formatGhs } from "@/lib/format-money";
import { PageHeader, Table, Th, Td, StatusBadge } from "../../_components/admin-ui";
import { MarkShipped } from "../mark-shipped";
import { MarkDelivered } from "../mark-delivered";

export const dynamic = "force-dynamic";

// Statuses where a "mark shipped" action makes sense (paid, awaiting dispatch).
const FULFILLABLE = new Set(["paid", "cod_collected"]);

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

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, payment_reference, status, total_ghs, e_levy_amount, payment_method, delivery_type, courier, tracking_number, created_at, users(name, email, phone), order_items(id, quantity, price_ghs, color_selected, frames(name, slug))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const customer = order.users as unknown as
    | { name: string | null; email: string; phone: string | null }
    | null;
  const items = (order.order_items ?? []) as unknown as Item[];
  const ref = order.payment_reference ?? order.id.slice(0, 8);

  return (
    <>
      <PageHeader
        title={`Order ${ref}`}
        description={`Placed ${dateFmt.format(new Date(order.created_at))}`}
        action={
          <Link href="/admin/orders" className="text-sm text-lumen-blue hover:underline">
            ← All orders
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Table>
            <thead>
              <tr>
                <Th>Item</Th>
                <Th>Colour</Th>
                <Th>Qty</Th>
                <Th>Price</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <Td>{it.frames?.name ?? "Removed frame"}</Td>
                  <Td>{it.color_selected ?? "—"}</Td>
                  <Td>{it.quantity}</Td>
                  <Td>{formatGhs(it.price_ghs)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:max-w-xs">
            {order.e_levy_amount > 0 && (
              <>
                <dt className="text-lumen-ink/60">E-Levy</dt>
                <dd className="text-right">{formatGhs(order.e_levy_amount)}</dd>
              </>
            )}
            <dt className="font-medium text-lumen-ink">Total</dt>
            <dd className="text-right font-medium">{formatGhs(order.total_ghs)}</dd>
          </dl>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="rounded-lg border border-lumen-ink/10 bg-white p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-lumen-ink/60">
              Status
            </h2>
            <StatusBadge status={order.status} />
            <div className="mt-4">
              {FULFILLABLE.has(order.status) ? (
                <MarkShipped orderId={order.id} />
              ) : order.status === "shipped" ? (
                <MarkDelivered orderId={order.id} />
              ) : (
                <p className="text-xs text-lumen-ink/55">
                  {order.status === "delivered"
                    ? "Delivered."
                    : "Not ready to ship — awaiting payment."}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-lumen-ink/10 bg-white p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-lumen-ink/60">
              Customer
            </h2>
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-lumen-ink">{customer?.name ?? "—"}</span>
              <span className="text-lumen-ink/70">{customer?.email ?? "—"}</span>
              <span className="text-lumen-ink/70">{customer?.phone ?? "—"}</span>
            </div>
          </section>

          <section className="rounded-lg border border-lumen-ink/10 bg-white p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-lumen-ink/60">
              Payment & delivery
            </h2>
            <dl className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-lumen-ink/60">Method</dt>
                <dd className="capitalize">{order.payment_method ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-lumen-ink/60">Reference</dt>
                <dd>{order.payment_reference ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-lumen-ink/60">Delivery</dt>
                <dd className="capitalize">{order.delivery_type ?? "—"}</dd>
              </div>
              {order.courier && (
                <div className="flex justify-between">
                  <dt className="text-lumen-ink/60">Courier</dt>
                  <dd>{order.courier}</dd>
                </div>
              )}
              {order.tracking_number && (
                <div className="flex justify-between gap-3">
                  <dt className="shrink-0 text-lumen-ink/60">Tracking</dt>
                  <dd className="min-w-0 break-all text-right">{order.tracking_number}</dd>
                </div>
              )}
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}
