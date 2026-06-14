import "server-only";
import { requireUser } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";

import { isLiveOrder } from "@/lib/order-tracker";

/**
 * Account dashboard reads (US-P1-06 / portal). Everything goes through the RLS
 * client (`createClient`) — never the secret key. RLS scopes rows to the user,
 * but every read ALSO filters by the owner explicitly: tables here carry an
 * admin-all policy, so an admin would otherwise see every row (a single() would
 * even error on multiple rows). `public.users` is the canonical profile source;
 * we fall back to the auth record (name in user_metadata, email) when sparse.
 */

export type AccountProfile = {
  email: string;
  name: string | null;
  phone: string | null;
};

export async function getAccountProfile(): Promise<AccountProfile> {
  const user = await requireUser();
  const supabase = await createClient();

  // Scope to the caller's own row. RLS still enforces access, but the explicit
  // .eq is required for correctness: an admin's `users admin all` policy grants
  // SELECT on *every* row, so an unfiltered maybeSingle() would match many rows
  // and error to null.
  const { data } = await supabase
    .from("users")
    .select("email, name, phone")
    .eq("id", user.id)
    .maybeSingle();

  const metadataName = (user.user_metadata?.name as string | undefined)?.trim();

  return {
    email: data?.email ?? user.email ?? "",
    name: data?.name?.trim() || metadataName || null,
    phone: data?.phone ?? null,
  };
}

export type LiveOrder = {
  id: string;
  payment_reference: string | null;
  status: string;
  total_ghs: number;
  created_at: string;
};

/**
 * The customer's most recent still-in-flight order (for the dashboard tracker),
 * plus the count of all live orders (for the sidebar badge + "Active orders"
 * tile). One query, filtered in memory by isLiveOrder so the tracker logic stays
 * in one place.
 */
export async function getActiveOrders(): Promise<{
  count: number;
  live: LiveOrder | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select("id, payment_reference, status, total_ghs, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as LiveOrder[];
  const active = rows.filter((o) => isLiveOrder(o.status));
  return { count: active.length, live: active[0] ?? null };
}

export type NextAppointment = {
  id: string;
  clinic_name: string;
  service: string;
  status: string;
  preferred_date: string | null;
};

/**
 * The customer's next upcoming appointment (requested or confirmed). Dated ones
 * sort first; an undated request (clinic confirms the slot later) still shows.
 */
export async function getNextAppointment(): Promise<NextAppointment | null> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("appointments")
    .select("id, clinic_name, service, status, preferred_date")
    .eq("user_id", user.id)
    .in("status", ["requested", "confirmed"])
    .order("preferred_date", { ascending: true, nullsFirst: false })
    .limit(1);

  return ((data ?? [])[0] as NextAppointment | undefined) ?? null;
}
