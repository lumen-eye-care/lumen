import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Secret-key Supabase client — BYPASSES RLS (CLAUDE.md security rule 5).
 * Server-only by construction (`import 'server-only'` hard-errors if any client
 * code imports this). Use only where a privileged operation genuinely needs it
 * (webhooks, admin writes, signed-URL generation); prefer the RLS-gated client.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
