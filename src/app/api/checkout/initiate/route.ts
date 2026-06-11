import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/server/supabase";
import { checkoutSchema } from "@/lib/checkout-schemas";
import {
  repriceCart,
  createPendingOrder,
  findOrderByIdempotencyKey,
} from "@/server/checkout";
import { initializeTransaction } from "@/server/paystack";
import { rateLimitKey } from "@/lib/rate-limit";
import { checkRateLimit } from "@/server/rate-limit";

/**
 * POST /api/checkout/initiate — create a pending order and a Paystack transaction
 * for MoMo/card, returning the hosted-checkout URL. (COD never reaches here; it
 * goes through the server action.)
 *
 * Security: requires sign-in (401 otherwise); server re-prices the cart from the
 * DB (never trusts client prices); honours an Idempotency-Key header so a retried
 * submit reuses the same order + reference instead of double-charging.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to check out." }, { status: 401 });
  }

  // 10 initiations/hour per user (audit 2.4) — caps pending-order bloat from a
  // scripted client. Idempotency-Key retries also consume budget; 10/h covers
  // a legitimate session with room for several retries.
  const limited = await checkRateLimit("checkoutInitiate", rateLimitKey(user.id));
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details." }, { status: 400 });
  }
  const { delivery, method, lines } = parsed.data;

  if (method === "cod") {
    return NextResponse.json(
      { error: "Cash on delivery does not use this endpoint." },
      { status: 400 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const callbackUrl = `${siteUrl}/checkout/callback`;
  const channels = method === "momo" ? ["mobile_money"] : ["card"];
  const email = user.email;
  if (!email) {
    return NextResponse.json({ error: "Your account has no email." }, { status: 400 });
  }

  // Idempotent retry: reuse the existing order + reference.
  const idempotencyKey = req.headers.get("Idempotency-Key");
  if (idempotencyKey) {
    const existing = await findOrderByIdempotencyKey(idempotencyKey);
    if (existing) {
      if (existing.status === "paid") {
        return NextResponse.json({ reference: existing.payment_reference, paid: true });
      }
      if (!existing.payment_reference) {
        return NextResponse.json({ error: "Could not resume your order." }, { status: 409 });
      }
      try {
        const init = await initializeTransaction({
          email,
          amount: existing.total_ghs,
          reference: existing.payment_reference,
          currency: "GHS",
          channels,
          callback_url: callbackUrl,
          metadata: { orderId: existing.id },
        });
        return NextResponse.json({
          authorization_url: init.data.authorization_url,
          reference: existing.payment_reference,
        });
      } catch (err) {
        console.error("[checkout] Paystack re-init failed", err);
        Sentry.captureException(err, {
          tags: { area: "checkout" },
          extra: { stage: "paystack-reinit", orderId: existing.id },
        });
        return NextResponse.json({ error: "Payment could not be started." }, { status: 502 });
      }
    }
  }

  // Re-price from the DB — the client cart's prices are never trusted.
  const priced = await repriceCart(lines);
  if (!priced.ok) {
    return NextResponse.json({ error: priced.error }, { status: 409 });
  }

  const order = await createPendingOrder({
    userId: user.id,
    method,
    delivery,
    priced,
    idempotencyKey: idempotencyKey ?? undefined,
  });
  if (!order.ok) {
    return NextResponse.json({ error: order.error }, { status: 500 });
  }

  try {
    const init = await initializeTransaction({
      email,
      amount: order.totalPesewa,
      reference: order.reference,
      currency: "GHS",
      channels,
      callback_url: callbackUrl,
      metadata: { orderId: order.orderId },
    });
    return NextResponse.json({
      authorization_url: init.data.authorization_url,
      reference: order.reference,
    });
  } catch (err) {
    console.error("[checkout] Paystack initialize failed", err);
    Sentry.captureException(err, {
      tags: { area: "checkout" },
      extra: { stage: "paystack-initialize", orderId: order.orderId },
    });
    return NextResponse.json({ error: "Payment could not be started." }, { status: 502 });
  }
}
