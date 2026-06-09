"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth-guards";
import { checkoutSchema, type CartLineInput } from "@/lib/checkout-schemas";
import {
  repriceCart,
  createPendingOrder,
  sendOrderConfirmationEmail,
} from "@/server/checkout";

/**
 * Cash-on-delivery order (US-P0-07). Skips Paystack entirely: the order is
 * created as `cod_pending` and Charity confirms collection from the admin.
 * Returns a result for the client to navigate on (no redirect), so the cart can
 * be cleared first. requireUser + server-side re-pricing still apply.
 */
export type PlaceCodResult =
  | { ok: true; orderId: string; reference: string }
  | { ok: false; error: string };

export async function placeCodOrder(input: {
  delivery: unknown;
  lines: CartLineInput[];
}): Promise<PlaceCodResult> {
  const user = await requireUser();

  const parsed = checkoutSchema.safeParse({
    delivery: input.delivery,
    method: "cod",
    lines: input.lines,
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check your delivery details." };
  }

  const priced = await repriceCart(parsed.data.lines);
  if (!priced.ok) {
    return { ok: false, error: priced.error };
  }

  const order = await createPendingOrder({
    userId: user.id,
    method: "cod",
    delivery: parsed.data.delivery,
    priced,
  });
  if (!order.ok) {
    return { ok: false, error: order.error };
  }

  if (user.email) {
    await sendOrderConfirmationEmail({
      to: user.email,
      name: parsed.data.delivery.name,
      reference: order.reference,
      totalPesewa: order.totalPesewa,
      method: "cod",
    });
  }

  revalidatePath("/account/orders");
  return { ok: true, orderId: order.orderId, reference: order.reference };
}
