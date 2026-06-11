import type { MetadataRoute } from "next";

/**
 * robots.txt — crawl the storefront, keep crawlers out of gated/transactional
 * routes (they 307 to /sign-in anyway; disallowing saves crawl budget and
 * stops the redirects appearing in results).
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/account",
        "/checkout",
        "/cart",
        "/api/",
        "/auth/",
        "/sign-in",
        "/sign-up",
        "/reset-password",
        "/update-password",
        "/monitoring",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
