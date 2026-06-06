import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/server/supabase";

/**
 * Require an authenticated user. Redirects to /sign-in otherwise.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  return user;
}

/**
 * Require an admin (CLAUDE.md security rule 3). Role is read ONLY from
 * app_metadata.role (server-controlled), never user_metadata (user-editable).
 * This runs in every admin-capable handler — middleware and RLS are the other
 * two layers, not a substitute for this one.
 */
export async function requireAdmin() {
  const user = await requireUser();
  const role = (user.app_metadata?.role as string | undefined) ?? "customer";
  if (role !== "admin") {
    console.error("Non-admin attempted admin action", { userId: user.id });
    redirect("/account");
  }
  return user;
}
