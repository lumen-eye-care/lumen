import { z } from "zod";
import { normalizeGhanaPhone } from "@/lib/checkout-schemas";

/**
 * Account profile validation (US-P1-06). Re-validated server-side in the
 * updateProfile action (src/app/(commerce)/account/actions.ts) — the client form
 * reuses these messages for UX only, never as the security boundary.
 *
 * Only `name` and `phone` are editable; `email` (auth-owned) and `role`
 * (server-controlled, CLAUDE.md rule 3) are deliberately absent so a tampered
 * field can never reach the DB update.
 */

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(80, "Name is too long."),
  // Phone is optional: blank clears it (column is nullable). A non-empty value
  // must be a valid Ghana number and is stored as E.164 (+233...).
  phone: z
    .string()
    .trim()
    .max(20, "Phone number is too long.")
    .transform((v, ctx) => {
      if (v === "") return null;
      const normalized = normalizeGhanaPhone(v);
      if (!normalized) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid Ghana phone number.",
        });
        return z.NEVER;
      }
      return normalized;
    }),
});

export type ProfileInput = z.infer<typeof profileSchema>;
