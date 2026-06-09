import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "@/lib/sentry-scrub";

/**
 * Sentry — Node runtime (Route Handlers, Server Actions, Server Components).
 * PII is scrubbed at the source (CLAUDE.md rule 10); tracing is off to stay
 * inside the 5K-events/mo free tier and keep the signal errors-only.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0,
  sendDefaultPii: false,
  beforeSend: scrubEvent,
  beforeSendTransaction: scrubEvent,
});
