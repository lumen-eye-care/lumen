import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withSentryConfig } from "@sentry/nextjs";

// Pin the workspace root to this project directory. Without it, Next infers the
// root from the nearest lockfile, which in a git worktree is the PARENT repo's
// pnpm-lock.yaml — Turbopack then resolves modules from the wrong root. Resolves
// to the main repo dir in main, the worktree dir here. (Module resolution for
// @sentry/opentelemetry is handled by .npmrc node-linker=hoisted, since
// Turbopack can't follow pnpm's nested symlink store on Windows worktrees.)
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Don't advertise the framework/version (security rule: reduce fingerprinting).
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: { root: projectRoot },
  experimental: {
    // Admin frame-photo uploads post a File through a Server Action; the default
    // body limit (~1 MB) would reject them. The `frames` bucket caps at 5 MB.
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    // Frame photography is served from the public Supabase Storage bucket.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/frames/**",
      },
    ],
  },
  // Baseline security headers on every response. CSP is set in middleware.ts
  // (CLAUDE.md rule 9) so it can stay request-aware.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

/**
 * Sentry wrapper. `tunnelRoute` proxies browser events through a same-origin
 * route (/monitoring) so no CSP connect-src widening is needed (rule 9) and
 * ad-blockers can't drop them. Source maps are deleted after upload so they are
 * never publicly served (no source disclosure). The build is a no-op when the
 * SENTRY_* build vars are absent.
 */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // SENTRY_AUTH_TOKEN (build-only secret) is read from the environment.
  silent: !process.env.CI,
  telemetry: false,
  tunnelRoute: "/monitoring",
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
});
