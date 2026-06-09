import * as Sentry from "@sentry/nextjs";
import { getSupabaseAdmin } from "@/server/supabase-admin";
import { verifyWebhookSignature } from "@/server/paystack";
import { isPaidChargeValid, sendOrderConfirmationEmail } from "@/server/checkout";

/**
 * POST /api/paystack/webhook — the fulfilment source of truth (CLAUDE.md rule 4).
 *
 * Order of operations is the whole security story:
 *  1. Verify HMAC-SHA512 over the RAW body (not parsed JSON) → 401 on mismatch.
 *  2. Only act on charge.success; ack everything else with 200.
 *  3. Verify amount + currency against the order — never deliver value on a mismatch.
 *  4. Claim the event in webhook_events (unique paystack_event_id) for idempotency;
 *     a replayed event is a 200 no-op.
 *  5. Flip pending → paid via the service-role client; a DB trigger blocks any
 *     downgrade, so a late/duplicate webhook can't revert a paid order.
 * Always 200 once authenticated (except true server errors) so Paystack stops retrying.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(raw, signature)) {
    console.error("[paystack] webhook signature verification failed");
    return new Response("Unauthorized", { status: 401 });
  }

  let event: { event?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  // We only fulfil on successful charges; acknowledge everything else.
  if (event.event !== "charge.success" || !event.data) {
    return new Response("OK", { status: 200 });
  }

  const data = event.data;
  const reference = typeof data.reference === "string" ? data.reference : null;
  const eventId = data.id != null ? String(data.id) : reference;
  const amountPesewa = typeof data.amount === "number" ? data.amount : NaN;
  const currency = typeof data.currency === "string" ? data.currency : "";
  if (!reference || !eventId) {
    return new Response("OK", { status: 200 });
  }

  const db = getSupabaseAdmin();

  // Look up the order this charge belongs to.
  const { data: order } = await db
    .from("orders")
    .select("id, status, total_ghs, payment_method, payment_reference, users(email, name)")
    .eq("payment_reference", reference)
    .maybeSingle();

  if (!order) {
    // Don't log the raw (payload-controlled) reference — it's a log-injection
    // sink. The reference is recoverable from the Paystack dashboard if needed.
    console.warn("[paystack] webhook for an unrecognised payment reference");
    return new Response("OK", { status: 200 });
  }

  // Anti-tamper: amount + currency must match what we expect to charge.
  if (!isPaidChargeValid({ event: event.event, currency, amountPesewa }, order.total_ghs)) {
    // Log only untainted values (order id from the DB, numeric amounts, a flag) —
    // never the raw payload strings, to avoid log injection.
    console.error("[paystack] charge mismatch — not fulfilling", {
      orderId: order.id,
      expected: order.total_ghs,
      got: amountPesewa,
      currencyOk: currency === "GHS",
    });
    // Security-relevant: someone presented a valid signature but the wrong
    // amount/currency. Alert on it. Context is order id + numbers only — never
    // the raw payload (rule 10).
    Sentry.captureMessage("paystack charge mismatch — not fulfilling", {
      level: "warning",
      tags: { area: "paystack-webhook" },
      extra: {
        orderId: order.id,
        expected: order.total_ghs,
        got: amountPesewa,
        currencyOk: currency === "GHS",
      },
    });
    return new Response("OK", { status: 200 });
  }

  // Idempotency: claim the event. A duplicate (23505) means it's already handled.
  const { error: claimError } = await db.from("webhook_events").insert({
    paystack_event_id: eventId,
    event: event.event,
    payload: event as never,
  });
  if (claimError) {
    if (claimError.code === "23505") {
      return new Response("OK", { status: 200 }); // already processed
    }
    console.error("[paystack] webhook_events insert error", claimError.message);
    Sentry.captureException(new Error("webhook_events insert failed"), {
      tags: { area: "paystack-webhook" },
      extra: { orderId: order.id, code: claimError.code },
    });
    return new Response("Server Error", { status: 500 });
  }

  // Fulfil: pending → paid only. The status-guard trigger blocks downgrades.
  const { error: updateError } = await db
    .from("orders")
    .update({ status: "paid" })
    .eq("id", order.id)
    .eq("status", "pending");

  if (updateError) {
    console.error("[paystack] order fulfilment update error", updateError.message);
    Sentry.captureException(new Error("order fulfilment update failed"), {
      tags: { area: "paystack-webhook" },
      extra: { orderId: order.id, code: updateError.code },
    });
    return new Response("Server Error", { status: 500 });
  }

  // Best-effort confirmation email — never blocks the 200.
  const customer = order.users as { email?: string; name?: string } | null;
  if (customer?.email) {
    await sendOrderConfirmationEmail({
      to: customer.email,
      name: customer.name ?? null,
      reference,
      totalPesewa: order.total_ghs,
      method: order.payment_method ?? "card",
    });
  }

  return new Response("OK", { status: 200 });
}
