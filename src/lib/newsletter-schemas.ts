import { z } from "zod";

/**
 * Newsletter signup validation (footer email capture). Kept in lib so it's
 * unit-testable and shared by the server action.
 */
export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address.")
    .max(254, "Email is too long."),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

/** Normalize for storage + case-insensitive dedup (matches the lower(email) index). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
