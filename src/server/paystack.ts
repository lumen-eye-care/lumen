import "server-only";
import crypto from "node:crypto";

const PAYSTACK_BASE = "https://api.paystack.co";

/**
 * Verify a Paystack webhook (CLAUDE.md security rule 4).
 * x-paystack-signature is HMAC SHA-512 of the RAW request body (not parsed JSON)
 * keyed on PAYSTACK_SECRET_KEY. Read the raw body, verify, THEN parse.
 * Comparison is timing-safe.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

type PaystackResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

async function paystackFetch<T>(
  path: string,
  init: RequestInit,
): Promise<PaystackResponse<T>> {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Paystack ${path} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as PaystackResponse<T>;
}

export function initializeTransaction(payload: {
  email: string;
  amount: number; // pesewa
  reference: string;
  channels?: string[];
  callback_url?: string;
  metadata?: Record<string, unknown>;
}) {
  return paystackFetch<{ authorization_url: string; reference: string }>(
    "/transaction/initialize",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function verifyTransaction(reference: string) {
  return paystackFetch<{ status: string; reference: string; amount: number }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
    { method: "GET" },
  );
}
