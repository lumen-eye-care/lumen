import { z } from "zod";

/**
 * Auth input validation (US-P0-04). Single source of truth, re-validated
 * server-side inside every auth action — client forms reuse these for UX only,
 * never as the security boundary (the #2 vibe-code gap: form validates, endpoint
 * doesn't). Keep min password length in sync with the Supabase Auth setting.
 */

// Supabase default minimum is 6; we require 8 here and should match it in the
// dashboard. Upper bound guards against pathological inputs / bcrypt's 72-byte limit.
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters.`)
  .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters.`);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.");

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Enter your name.")
  .max(80, "Name is too long.");

export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  // Don't apply length rules on sign-in — only the credential check matters, and
  // a length error here would leak nothing useful while annoying valid users.
  password: z.string().min(1, "Enter your password."),
});

export const resetRequestSchema = z.object({
  email: emailSchema,
});

export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
