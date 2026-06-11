import "server-only";
import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { firstForwardedIp, secondsUntil } from "@/lib/rate-limit";

/**
 * Application-layer rate limiting (audit 2.4) via Upstash Redis free tier.
 *
 * Why here and not Supabase's built-in throttle: sign-in/reset/signup run in
 * server actions, so Supabase only ever sees Vercel's shared egress IP — its
 * per-IP limits can't tell an attacker from customers (and could lock out
 * everyone at once). We key on the *real* client IP / email / user id instead.
 *
 * Behavior without UPSTASH_* env (local dev, CI, preview worktrees): no-op,
 * everything allowed — same "inert without env" pattern as Sentry/Resend.
 * On Redis errors we FAIL OPEN: auth and checkout must not depend on a
 * third-party cache being up; the limiter is abuse control, not a gate.
 */

type LimiterName = "signIn" | "signUp" | "passwordReset" | "checkoutInitiate";

// Sliding windows per the audit: sign-in 5/15 min per IP+email; signup 5/h
// per IP; reset 3/h per email (protects the inbox + Resend quota); checkout
// initiate 10/h per user (caps pending-order rows).
function buildLimiters(redis: Redis): Record<LimiterName, Ratelimit> {
  return {
    signIn: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "rl:sign-in",
    }),
    signUp: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      prefix: "rl:sign-up",
    }),
    passwordReset: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 h"),
      prefix: "rl:reset",
    }),
    checkoutInitiate: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      prefix: "rl:checkout",
    }),
  };
}

// undefined = not initialised yet; null = env absent (limiting disabled).
let limiters: Record<LimiterName, Ratelimit> | null | undefined;

function getLimiters(): Record<LimiterName, Ratelimit> | null {
  if (limiters !== undefined) return limiters;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    limiters = null;
    return null;
  }
  limiters = buildLimiters(new Redis({ url, token }));
  return limiters;
}

/** Real client IP (first x-forwarded-for entry, set by Vercel). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return firstForwardedIp(h.get("x-forwarded-for"));
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

/**
 * Consume one attempt against the named limiter. `key` should come from
 * rateLimitKey() so no raw PII reaches Redis.
 */
export async function checkRateLimit(
  name: LimiterName,
  key: string,
): Promise<RateLimitResult> {
  const all = getLimiters();
  if (!all) return { ok: true };
  try {
    const { success, reset } = await all[name].limit(key);
    if (success) return { ok: true };
    return { ok: false, retryAfterSeconds: secondsUntil(reset) };
  } catch (err) {
    console.error(
      "[rate-limit] check failed, allowing request",
      err instanceof Error ? err.message : err,
    );
    return { ok: true };
  }
}
