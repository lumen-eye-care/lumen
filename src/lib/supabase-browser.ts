import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components. Uses the public publishable key — RLS
 * gates every read/write. Never import the secret-key client into client code.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
