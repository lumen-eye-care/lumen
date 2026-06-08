import Link from "next/link";
import { requireAdmin } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import { formatGhs } from "@/lib/format-money";
import { PageHeader, Table, Th, Td, Alert, StatusBadge } from "../_components/admin-ui";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  payment_reference: string | null;
  status: string;
  total_ghs: number;
  payment_method: string | null;
  created_at: string;
  users: { name: string | null; email: string } | null;
  order_items: { count: number }[];
};

const dateFmt = new Intl.DateTimeFormat("en-GH", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminOrdersPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Admin RLS (`orders admin all`) returns every order.
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, payment_reference, status, total_ghs, payment_method, created_at, users(name, email), order_items(count)",
    )
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as unknown as OrderRow[];

  return (
    <>
      <PageHeader
        title="Orders"
        description="Newest first. Open an order to view items and mark it shipped."
      />

      {error && (
        <div className="mb-4">
          <Alert kind="error">Could not load orders: {error.message}</Alert>
        </div>
      )}

      {orders.length === 0 ? (
        <p className="text-sm text-lumen-ink/60">No orders yet.</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th>Items</Th>
              <Th>Total</Th>
              <Th>Payment</Th>
              <Th>Status</Th>
              <Th>Placed</Th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <Td>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-medium text-lumen-blue underline-offset-2 hover:underline"
                  >
                    {o.payment_reference ?? o.id.slice(0, 8)}
                  </Link>
                </Td>
                <Td>
                  <div className="flex flex-col">
                    <span className="text-lumen-ink">{o.users?.name ?? "—"}</span>
                    <span className="text-xs text-lumen-ink/50">
                      {o.users?.email ?? ""}
                    </span>
                  </div>
                </Td>
                <Td>{o.order_items?.[0]?.count ?? 0}</Td>
                <Td>{formatGhs(o.total_ghs)}</Td>
                <Td className="capitalize">{o.payment_method ?? "—"}</Td>
                <Td>
                  <StatusBadge status={o.status} />
                </Td>
                <Td className="whitespace-nowrap text-lumen-ink/70">
                  {dateFmt.format(new Date(o.created_at))}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
