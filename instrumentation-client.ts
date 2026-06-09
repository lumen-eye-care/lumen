import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "@/lib/sentry-scrub";

/**
 * Sentry — browser. PII scrubbed at the source (CLAUDE.md rule 10) and Session
 * Replay deliberately NOT enabled: it would capture the checkout DOM (names,
 * phones, delivery addresses) and burn the free-tier quota. Events are sent via
 * the same-origin tunnel (next.config.ts `tunnelRoute`), so no CSP `connect-src`
 * widening is needed and ad-blockers can't drop them.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0,
  sendDefaultPii: false,
  // Replay off (no replayIntegration); rates pinned to 0 to make intent explicit.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  beforeSend: scrubEvent,
  beforeSendTransaction: scrubEvent,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
