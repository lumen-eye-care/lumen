"use server";

import { newsletterSchema } from "@/lib/newsletter-schemas";
import { subscribeToNewsletter } from "@/server/newsletter";
import { checkRateLimit, clientIp } from "@/server/rate-limit";
import { rateLimitKey } from "@/lib/rate-limit";

export type NewsletterState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; error: string };

export async function subscribeNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const raw = formData.get("email");
  const parsed = newsletterSchema.safeParse({
    email: typeof raw === "string" ? raw.trim() : "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      error:
        parsed.error.flatten().fieldErrors.email?.[0] ??
        "Enter a valid email address.",
    };
  }

  // Abuse control on an open insert endpoint: 5/h per IP. Fails open when
  // UPSTASH_* is unset (same inert-without-env pattern as auth/checkout).
  const limit = await checkRateLimit("newsletter", rateLimitKey(await clientIp()));
  if (!limit.ok) {
    return {
      status: "error",
      error: "Too many attempts. Please try again later.",
    };
  }

  const result = await subscribeToNewsletter(parsed.data.email);
  if (!result.ok) {
    return { status: "error", error: result.error };
  }

  return {
    status: "success",
    message: result.alreadySubscribed
      ? "You're already on the list — thanks!"
      : "Thanks — you're on the list.",
  };
}
