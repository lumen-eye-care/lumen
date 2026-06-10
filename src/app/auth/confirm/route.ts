import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/server/supabase";
import { safeRedirect } from "@/lib/safe-redirect";

/**
 * Email confirmation + password recovery landing (US-P0-04). Supabase email
 * templates point here with the token_hash flow. `next` carries where the user
 * was so confirmation returns them there (e.g. /checkout), not always /account.
 *
 * Confirm signup — the link is built by appending the token to emailRedirectTo
 * (which signUp set to `…/auth/confirm?next=<relative path>`), so the template is:
 *   {{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email
 *   → …/auth/confirm?next=%2Fcheckout&token_hash=…&type=email
 * Recovery (static next):
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/update-password
 *
 * verifyOtp establishes the session (sets cookies via the SSR client), then we
 * redirect through safeRedirect() (rule 2) so a tampered ?next can't bounce the
 * user off-site. No UI — this lives outside the (auth) route group on purpose.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeRedirect(searchParams.get("next"), "/account");

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Missing/invalid/expired link — send to sign-in with a generic hint.
  return NextResponse.redirect(
    new URL("/sign-in?error=link_invalid", request.url),
  );
}
