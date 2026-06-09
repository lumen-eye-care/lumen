import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Secret-key Supabase client — BYPASSES RLS (CLAUDE.md security rule 5).
 * Server-only by construction (`import 'server-only'` hard-errors if any client
 * code imports this). Use only where a privileged operation genuinely needs it
 * (webhooks, admin writes, signed-URL generation); prefer the RLS-gated client.
 *
 * Constructed lazily (not at module load) so a route that imports it can still be
 * statically analysed at build time without the env present — `createClient`
 * throws "supabaseUrl is required" if called with undefined env (e.g. in CI).
 */
let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }
  return client;
}
