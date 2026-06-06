import "server-only";
import { z } from "zod";

/**
 * Server-side environment validation. Call getEnv() from server code that needs
 * guaranteed-present config; it fails fast with a clear error if anything is
 * missing. Lazy (not parsed at import) so the scaffold builds without secrets.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PAYSTACK_PUBLIC_KEY: z.string().min(1),
  PAYSTACK_SECRET_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().min(1),
  LUMEN_PRESCRIPTION_UPLOAD_ENABLED: z
    .enum(["true", "false"])
    .default("false"),
  ADMIN_EMAIL_DOMAINS: z.string().default(""),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (!cached) {
    cached = envSchema.parse(process.env);
  }
  return cached;
}
