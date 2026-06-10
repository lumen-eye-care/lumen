import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/types";

/**
 * Cookie-less anonymous Supabase client for public-read data rendered in
 * shared chrome (e.g. the site footer). Publishable key, so RLS applies —
 * only public-read policies are visible. Unlike src/server/supabase.ts this
 * never touches cookies(), so pages using it can stay statically rendered.
 */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
