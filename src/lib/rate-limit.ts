import { createHash } from "node:crypto";

/**
 * Pure rate-limit helpers (audit 2.4). The Upstash wiring lives in
 * src/server/rate-limit.ts; these stay in lib so they're unit-testable.
 */

/**
 * Build an opaque limiter key from identifying parts (IP, email, user id).
 * Hashed so raw PII never lands in third-party Redis (security rule 10) —
 * the limiter only needs equality, not the value.
 */
export function rateLimitKey(
  ...parts: (string | null | undefined)[]
): string {
  const normalized = parts.map((p) => (p ?? "").trim().toLowerCase()).join("|");
  return createHash("sha256").update(normalized).digest("hex").slice(0, 32);
}

/** Whole seconds from now until an epoch-ms reset, floored at 1. */
export function secondsUntil(resetMs: number, nowMs = Date.now()): number {
  return Math.max(1, Math.ceil((resetMs - nowMs) / 1000));
}

/**
 * Client IP from an x-forwarded-for value. Vercel sets the real client IP as
 * the first entry; "unknown" groups direct/headerless requests together
 * rather than letting them bypass the limit.
 */
export function firstForwardedIp(header: string | null): string {
  const first = header?.split(",")[0]?.trim();
  return first && first.length > 0 ? first : "unknown";
}
