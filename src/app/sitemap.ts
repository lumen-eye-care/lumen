import type { MetadataRoute } from "next";
import { createPublicClient } from "@/server/supabase-public";

/**
 * sitemap.xml — static storefront routes + one entry per active frame PDP.
 * Uses the cookie-less public client (RLS "frames public read" already
 * restricts anon to is_active=true) and revalidates hourly so new frames
 * appear without a deploy.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/shop`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/clinics`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/book`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // No Supabase env (bare CI / Lighthouse builds) → static routes only.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return staticRoutes;
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("frames")
    .select("slug, updated_at")
    .eq("is_active", true);

  if (error) {
    console.error("[sitemap] frames query error", error.message);
    return staticRoutes;
  }

  const frameRoutes: MetadataRoute.Sitemap = (data ?? []).map((frame) => ({
    url: `${siteUrl}/shop/${frame.slug}`,
    lastModified: new Date(frame.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...frameRoutes];
}
