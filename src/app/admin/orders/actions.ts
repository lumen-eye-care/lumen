"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import { getResend } from "@/server/resend";
import { formatGhs } from "@/lib/format-money";
import { markShippedSchema, markDeliveredSchema } from "@/lib/frame-schemas";

/**
 * Order fulfilment actions (US-P1-07). requireAdmin() first (rule 3); the status
 * write goes through the RLS client so `orders admin all` enforces at Postgres
 * (rule 6). The shipped email is best-effort — a Resend failure must never roll
 * back a confirmed fulfilment, so we update first, then email, and surface a
 * soft warning. revalidatePath refreshes both the admin and customer views.
 */

// Must be a sender on the verified Resend domain (PROGRESS.md: verification
// still pending — until then this lands in spam / fails, handled gracefully).
const ORDERS_FROM = "Lumen Eye Care <orders@lumeneye.org>";

export type MarkShippedState = {
  error?: string;
  success?: string;
  warning?: string;
};

export async function markShipped(
  _prev: MarkShippedState,
  formData: FormData,
): Promise<MarkShippedState> {
  await requireAdmin();

  const parsed = markShippedSchema.safeParse({
    orderId: formData.get("orderId"),
    courier: formData.get("courier"),
    tracking_number: formData.get("tracking_number"),
  });
  if (!parsed.success) return { error: "Invalid order." };
  const { orderId, courier, tracking_number } = parsed.data;

  const supabase = await createClient();

  // Update + return the row joined with the customer for the email.
  const { data: order, error } = await supabase
    .from("orders")
    .update({
      status: "shipped",
      courier: courier || null,
      tracking_number: tracking_number || null,
    })
    .eq("id", orderId)
    .select("id, payment_reference, total_ghs, courier, tracking_number, users(email, name)")
    .single();

  if (error || !order) {
    return { error: "Could not mark this order as shipped. Please try again." };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);

  // Best-effort email — never blocks the status change.
  const customer = order.users as { email?: string; name?: string } | null;
  if (customer?.email) {
    try {
      const ref = order.payment_reference ?? order.id.slice(0, 8);
      const shipLine = order.courier
        ? `\nCourier: ${order.courier}${order.tracking_number ? ` · Tracking: ${order.tracking_number}` : ""}\n`
        : "";
      await getResend().emails.send({
        from: ORDERS_FROM,
        to: customer.email,
        subject: `Your Lumen order ${ref} has shipped`,
        text:
          `Hi ${customer.name ?? "there"},\n\n` +
          `Good news — your Lumen order (${ref}, ${formatGhs(order.total_ghs)}) is on its way.\n` +
          shipLine +
          `\nYou can follow it in your account.\n\nThank you,\nThe Lumen team`,
      });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Shipped-email send failed (non-fatal)", err);
      }
      return {
        success: "Order marked as shipped.",
        warning: "The customer email could not be sent.",
      };
    }
  }

  return { success: "Order marked as shipped." };
}

/**
 * Mark a shipped order as delivered — the forward shipped → delivered move the
 * append-only status guard (20260609000001_checkout.sql) permits. This is the
 * only path that completes the customer-facing tracker timeline. Best-effort
 * email mirrors markShipped; a Resend failure never rolls back the status.
 */
export type MarkDeliveredState = {
  error?: string;
  success?: string;
  warning?: string;
};

export async function markDelivered(
  _prev: MarkDeliveredState,
  formData: FormData,
): Promise<MarkDeliveredState> {
  await requireAdmin();

  const parsed = markDeliveredSchema.safeParse({ orderId: formData.get("orderId") });
  if (!parsed.success) return { error: "Invalid order." };
  const { orderId } = parsed.data;

  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .update({ status: "delivered" })
    .eq("id", orderId)
    .select("id, payment_reference, users(email, name)")
    .single();

  if (error || !order) {
    return { error: "Could not mark this order as delivered. Please try again." };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);

  const customer = order.users as { email?: string; name?: string } | null;
  if (customer?.email) {
    try {
      const ref = order.payment_reference ?? order.id.slice(0, 8);
      await getResend().emails.send({
        from: ORDERS_FROM,
        to: customer.email,
        subject: `Your Lumen order ${ref} has been delivered`,
        text:
          `Hi ${customer.name ?? "there"},\n\n` +
          `Your Lumen order (${ref}) has been delivered. We hope you love your new frames!\n\n` +
          `If anything isn't right, just reply to this email.\n\nThank you,\nThe Lumen team`,
      });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Delivered-email send failed (non-fatal)", err);
      }
      return {
        success: "Order marked as delivered.",
        warning: "The customer email could not be sent.",
      };
    }
  }

  return { success: "Order marked as delivered." };
}
