import "server-only";
import crypto from "node:crypto";
import { createClient } from "@/server/supabase";
import { getResend } from "@/server/resend";
import { renderOrderConfirmedEmail } from "@/server/email";
import type { CartLineInput, DeliveryInput, PaymentMethod } from "@/lib/checkout-schemas";
import {
  priceLines,
  type PriceableFrame,
  type RepriceOk,
  type RepriceResult,
} from "@/lib/checkout-pricing";

// Re-export the pure helpers so server callers (e.g. the webhook) have one import.
export { priceLines, isPaidChargeValid } from "@/lib/checkout-pricing";
export type {
  PricedLine,
  PriceableFrame,
  RepriceOk,
  RepriceError,
  RepriceResult,
} from "@/lib/checkout-pricing";

/**
 * Checkout server logic (US-P0-05/06/07). The security spine:
 *  - prices are ALWAYS re-derived from the DB here, never trusted from the client
 *    cart (src/lib/cart.ts says so explicitly).
 *  - order + item writes go through the RLS-gated client, so "orders insert own"
 *    enforces ownership at Postgres (sign-in required in v1).
 */

// Must be a sender on the verified Resend domain (PROGRESS.md: verification still
// pending — until then this lands in spam / fails, handled gracefully).
const ORDERS_FROM = "Lumen Eye Care <orders@lumeneye.org>";

/** Load the requested frames (RLS shows only active) and price them server-side. */
export async function repriceCart(lines: CartLineInput[]): Promise<RepriceResult> {
  if (lines.length === 0) return { ok: false, error: "Your bag is empty." };

  const supabase = await createClient();
  const ids = [...new Set(lines.map((l) => l.frameId))];
  const { data, error } = await supabase
    .from("frames")
    .select("id, name, slug, price_ghs, stock, colors")
    .in("id", ids);

  if (error) {
    console.error("[checkout] repriceCart load error", error.message);
    return { ok: false, error: "Could not price your bag. Please try again." };
  }

  const frames: PriceableFrame[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    price_ghs: row.price_ghs,
    stock: row.stock,
    colors: Array.isArray(row.colors)
      ? row.colors.flatMap((c) =>
          c && typeof c === "object" && !Array.isArray(c) && typeof c.name === "string"
            ? [{ name: c.name }]
            : [],
        )
      : [],
  }));

  return priceLines(lines, frames);
}

/** Paystack reference: unique, prefixed, underscore-safe. */
export function generateReference(): string {
  return `lumen_${crypto.randomBytes(12).toString("hex")}`;
}

export type CreateOrderResult =
  | { ok: true; orderId: string; reference: string; status: string; totalPesewa: number }
  | { ok: false; error: string };

/**
 * Look up an existing order by initiate Idempotency-Key for the current user.
 * Lets /api/checkout/initiate short-circuit a retried request instead of creating
 * a duplicate order + Paystack charge.
 */
export async function findOrderByIdempotencyKey(key: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, payment_reference, status, total_ghs")
    .eq("idempotency_key", key)
    .maybeSingle();
  return data;
}

/**
 * Insert a pending order + its items via the RLS client (the signed-in user owns
 * the rows). momo/card → 'pending'; cod → 'cod_pending'. Prices are the DB-priced
 * values, never the client's.
 */
export async function createPendingOrder(params: {
  userId: string;
  method: PaymentMethod;
  delivery: DeliveryInput;
  priced: RepriceOk;
  idempotencyKey?: string;
}): Promise<CreateOrderResult> {
  const { method, delivery, priced, idempotencyKey } = params;
  const supabase = await createClient();
  const reference = generateReference();
  const status = method === "cod" ? "cod_pending" : "pending";

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: params.userId,
      status,
      total_ghs: priced.totalPesewa,
      currency: "GHS",
      payment_method: method,
      payment_reference: reference,
      delivery_type: "delivery",
      delivery_name: delivery.name,
      delivery_phone: delivery.phone,
      delivery_city: delivery.city,
      delivery_address: delivery.address,
      delivery_landmark: delivery.landmark || null,
      idempotency_key: idempotencyKey ?? null,
    })
    .select("id")
    .single();

  if (error || !order) {
    console.error("[checkout] createPendingOrder insert error", error?.message);
    return { ok: false, error: "Could not start your order. Please try again." };
  }

  const items = priced.lines.map((l) => ({
    order_id: order.id,
    frame_id: l.frameId,
    color_selected: l.colorName,
    price_ghs: l.unitPricePesewa,
    quantity: l.qty,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(items);
  if (itemsError) {
    console.error("[checkout] createPendingOrder items error", itemsError.message);
    return { ok: false, error: "Could not start your order. Please try again." };
  }

  return { ok: true, orderId: order.id, reference, status, totalPesewa: priced.totalPesewa };
}

/**
 * Best-effort order confirmation email — mirrors admin/orders/actions.ts: never
 * blocks fulfilment, no-ops cleanly while RESEND_API_KEY is unset.
 */
export async function sendOrderConfirmationEmail(params: {
  to: string;
  name: string | null;
  reference: string;
  totalPesewa: number;
  method: string;
}): Promise<void> {
  const { to, name, reference, totalPesewa, method } = params;
  const isCod = method === "cod";
  try {
    const body = await renderOrderConfirmedEmail({ name, reference, totalPesewa, method });
    await getResend().emails.send({
      from: ORDERS_FROM,
      to,
      subject: `${isCod ? "Order received" : "Order confirmed"} — ${reference}`,
      html: body.html,
      text: body.text,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Order confirmation email failed (non-fatal)", err);
    }
  }
}
