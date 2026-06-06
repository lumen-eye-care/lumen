import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components. Uses the public anon key — RLS gates
 * every read/write. Never import the service-role client into client code.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
