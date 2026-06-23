import "server-only";
import { createClient } from "@/server/supabase";
import { normalizeEmail } from "@/lib/newsletter-schemas";

export type SubscribeResult =
  | { ok: true; alreadySubscribed: boolean }
  | { ok: false; error: string };

/**
 * Insert a newsletter signup via the RLS-gated publishable-key client. Anyone
 * (anonymous included) can insert; nobody but an admin can read the list. No
 * `.select()` after insert — the anon role has no SELECT policy, so we only
 * need the write to succeed. Env-guarded like src/server/appointments.ts.
 */
export async function subscribeToNewsletter(
  email: string,
): Promise<SubscribeResult> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return { ok: false, error: "Service temporarily unavailable." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("newsletter_signups")
    .insert({ email: normalizeEmail(email), source: "footer" });

  if (error) {
    // 23505 = unique violation → already on the list. Treat as success so we
    // don't leak membership or error out a re-subscribe.
    if (error.code === "23505") {
      return { ok: true, alreadySubscribed: true };
    }
    console.error("[newsletter] subscribe error", error.message);
    return {
      ok: false,
      error: "Could not subscribe right now. Please try again.",
    };
  }

  return { ok: true, alreadySubscribed: false };
}
