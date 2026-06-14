"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import { profileSchema } from "@/lib/account-schemas";
import type { AuthState } from "@/app/(auth)/actions";

/**
 * Account profile update (US-P1-06). Same-origin, RLS-gated publishable-key
 * client (rule 5). Returns the AuthState shape so the form reuses the same
 * inline-error rendering as the auth forms.
 */

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

export async function updateProfile(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  const supabase = await createClient();

  // SECURITY: hard-whitelist {name, phone}. The `users update own` policy is
  // `using (auth.uid() = id)` with NO `with check`, so column safety lives here —
  // never write `role` (server-controlled, CLAUDE.md rule 3). The .eq keeps the
  // update pinned to the caller's own row even though RLS already scopes it.
  const { error } = await supabase
    .from("users")
    .update({ name: parsed.data.name, phone: parsed.data.phone })
    .eq("id", user.id);

  if (error) {
    return { error: "Could not save your details. Please try again." };
  }

  revalidatePath("/account");
  return { success: "Your details have been saved." };
}
