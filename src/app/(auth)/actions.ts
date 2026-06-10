"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/server/supabase";
import { safeRedirect } from "@/lib/safe-redirect";
import {
  signUpSchema,
  signInSchema,
  resetRequestSchema,
  newPasswordSchema,
} from "@/lib/auth-schemas";

/**
 * Auth server actions (US-P0-04). All flows are same-origin (no CORS, rule 1)
 * and use the RLS-gated publishable-key client (rule 5) — the secret-key client
 * is never touched here. Cookies are written with @supabase/ssr defaults
 * (Secure / HttpOnly / SameSite=Lax, rule 8); we never override them. Every
 * redirect target passes through safeRedirect() (rule 2). Errors are generic to
 * avoid account enumeration (rule 10 / app-flow §2) and we never log credentials.
 */

export type AuthState = {
  error?: string;
  success?: string;
  /** Field-level errors keyed by input name, for inline form display. */
  fieldErrors?: Record<string, string>;
};

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** First message per field from a Zod flatten, for inline display. */
function firstFieldErrors(
  fieldErrors: Record<string, string[] | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(fieldErrors)) {
    if (msgs && msgs[0]) out[key] = msgs[0];
  }
  return out;
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  const next = safeRedirect(formData.get("redirect") as string | null, "/account");
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Stored in raw_user_meta_data; the handle_new_user trigger copies it into
      // public.users.name. NOT a security claim — role stays the DB default.
      data: { name: parsed.data.name },
      // Carry where they were (e.g. /checkout) into the confirmation link so the
      // email lands them back there, not always /account. `next` is already a
      // safe relative path (safeRedirect above). The email template appends the
      // token to this URL: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`,
      // and /auth/confirm re-checks `next` through safeRedirect (rule 2).
      emailRedirectTo: `${siteUrl()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return { error: "Could not create your account. Please try again." };
  }

  // Email confirmation OFF (dev): a session is returned and the cookie is set —
  // go straight in. Confirmation ON (prod): no session — prompt to check email.
  if (data.session) {
    redirect(next);
  }
  // Generic on purpose (rule 10 / app-flow §2): with Supabase email-enumeration
  // protection ON, an already-registered email returns this same response (and the
  // owner is emailed a sign-in link), so the copy must read true for both cases
  // without revealing whether the address already has an account.
  return {
    success:
      "Check your email to continue. If you already have a Lumen account, we've sent a sign-in link instead.",
  };
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    // Uniform message — never reveal which field or whether the email exists.
    return { error: "Invalid email or password." };
  }

  const next = safeRedirect(formData.get("redirect") as string | null, "/account");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Invalid email or password." };
  }

  redirect(next);
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });

  // Always return the same response, valid email or not, success or error — a
  // differing reply would reveal whether the account exists (enumeration).
  const generic: AuthState = {
    success: "If an account exists for that email, a reset link is on its way.",
  };
  if (!parsed.success) return generic;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/auth/confirm?next=/update-password`,
  });
  return generic;
}

export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  const supabase = await createClient();
  // Requires the recovery session set by /auth/confirm (type=recovery). If it's
  // missing or expired, updateUser fails and we bounce back to request a link.
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return {
      error: "Could not update your password. The link may have expired — request a new one.",
    };
  }

  redirect("/account");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
