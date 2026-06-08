import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't advertise the framework/version (security rule: reduce fingerprinting).
  poweredByHeader: false,
  reactStrictMode: true,
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

export default nextConfig;
