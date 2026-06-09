import * as Sentry from "@sentry/nextjs";

/**
 * Next.js instrumentation hook. Loads the runtime-appropriate Sentry config and
 * wires automatic capture of Server Component + Route Handler errors via
 * `onRequestError`. No-ops when NEXT_PUBLIC_SENTRY_DSN is unset (the SDK simply
 * doesn't send), so local/CI builds without Sentry are unaffected.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
