import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import { formatGhs } from "@/lib/format-money";
import { EmptyState } from "@/components/atoms/empty-state";
import { OrderStatusPill } from "@/components/molecules/order-status-pill";
import { Icon } from "@/components/atoms/icon";

export const metadata: Metadata = {
  title: "My orders",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" });

type OrderRow = {
  id: string;
  payment_reference: string | null;
  status: string;
  total_ghs: number;
  payment_method: string | null;
  created_at: string;
  order_items: { count: number }[];
};

/**
 * US-P0-08 — a signed-in customer's order history. The read goes through the
 * RLS client (`createClient`); `orders read own` (auth.uid() = user_id) scopes it
 * to this user, so we never pass a user_id filter and never touch the secret key.
 */
export default async function MyOrdersPage() {
  await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select(
      "id, payment_reference, status, total_ghs, payment_method, created_at, order_items(count)",
    )
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as unknown as OrderRow[];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-lumen-ink">My orders</h1>
        <Link
          href="/account"
          className="text-sm text-lumen-blue underline-offset-2 hover:underline"
        >
          ← Account
        </Link>
      </header>

      {orders.length === 0 ? (
        <EmptyState
          icon="cart"
          title="No orders yet"
          description="When you place an order it'll show up here so you can track it."
          cta={{ label: "Browse frames", href: "/shop" }}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((o) => {
            const itemCount = o.order_items?.[0]?.count ?? 0;
            return (
              <li key={o.id}>
                <Link
                  href={`/account/orders/${o.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-lumen-ink/10 bg-white p-5 transition-colors hover:border-lumen-ink/25"
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="font-medium text-lumen-ink">
                      {o.payment_reference ?? `Order ${o.id.slice(0, 8)}`}
                    </span>
                    <span className="text-sm text-lumen-ink/55">
                      {dateFmt.format(new Date(o.created_at))} ·{" "}
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </span>
                    <OrderStatusPill status={o.status} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-lumen-ink">
                      {formatGhs(o.total_ghs)}
                    </span>
                    <Icon name="chev" size={20} className="text-lumen-ink/40" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
