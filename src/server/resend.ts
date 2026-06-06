import "server-only";
import { Resend } from "resend";

/**
 * Resend client for transactional email (order confirmations, password resets).
 * Lazily constructed so importing this module doesn't require the API key at
 * build time. Server-only.
 */
let client: Resend | null = null;

export function getResend(): Resend {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}
