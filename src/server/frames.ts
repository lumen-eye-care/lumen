import "server-only";
import { createClient } from "@/server/supabase";
import type { Json } from "@/db/types";

/** Strongly-typed colour entry (stored as Json in DB). */
export type FrameColor = {
  name: string;
  hex: string;
};

/** Shape of a category row joined onto frames. */
export type FrameCategory = {
  id: string;
  slug: string;
  name: string;
  hero_title: string | null;
  hero_subtitle: string | null;
};

/**
 * Public frame row as returned by shop queries.
 * photo_urls and colors are narrowed from the raw DB Json/string[] types.
 */
export type ShopFrame = {
  id: string;
  name: string;
  slug: string;
  price_ghs: number;
  stock: number;
  badge: string | null;
  shape: string | null;
  gender: string | null;
  material: string | null;
  description: string | null;
  colors: FrameColor[];
  photo_urls: string[];
  category: FrameCategory | null;
};

/** Narrow Json → FrameColor[]; silently drops malformed entries. */
function parseColors(raw: Json): FrameColor[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (
      item !== null &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      typeof item.name === "string" &&
      typeof item.hex === "string"
    ) {
      return [{ name: item.name, hex: item.hex }];
    }
    return [];
  });
}

/** Fetch all active frame categories ordered by sort_order. */
export async function getActiveCategories(): Promise<FrameCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("frame_categories")
    .select("id, slug, name, hero_title, hero_subtitle")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error("[frames] getActiveCategories error", error.message);
    return [];
  }
  return (data ?? []) as FrameCategory[];
}

/**
 * Fetch all active frames, optionally scoped to a category slug.
 * RLS policy "frames public read" restricts rows to is_active=true for anon.
 * Never uses the admin client — no RLS bypass here.
 */
export async function getActiveFrames(
  categorySlug?: string,
): Promise<ShopFrame[]> {
  const supabase = await createClient();

  let query = supabase
    .from("frames")
    .select(
      "id, name, slug, price_ghs, stock, badge, shape, gender, material, description, colors, photo_urls, frame_categories!inner(id, slug, name, hero_title, hero_subtitle)",
    )
    .order("created_at", { ascending: false });

  if (categorySlug && categorySlug !== "all") {
    query = query.eq("frame_categories.slug", categorySlug);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[frames] getActiveFrames error", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    // frame_categories comes back as a single object (FK) not an array
    const cat = Array.isArray(row.frame_categories)
      ? (row.frame_categories[0] ?? null)
      : (row.frame_categories ?? null);

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      price_ghs: row.price_ghs,
      stock: row.stock,
      badge: row.badge,
      shape: row.shape,
      gender: row.gender,
      material: row.material,
      description: row.description,
      colors: parseColors(row.colors),
      photo_urls: row.photo_urls ?? [],
      category: cat as FrameCategory | null,
    };
  });
}

/**
 * Fetch a single active frame by slug.
 * Returns null if not found or not active (RLS enforces the latter).
 */
export async function getFrameBySlug(slug: string): Promise<ShopFrame | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("frames")
    .select(
      "id, name, slug, price_ghs, stock, badge, shape, gender, material, description, colors, photo_urls, frame_categories(id, slug, name, hero_title, hero_subtitle)",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[frames] getFrameBySlug error", error.message);
    return null;
  }
  if (!data) return null;

  const cat = Array.isArray(data.frame_categories)
    ? (data.frame_categories[0] ?? null)
    : (data.frame_categories ?? null);

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    price_ghs: data.price_ghs,
    stock: data.stock,
    badge: data.badge,
    shape: data.shape,
    gender: data.gender,
    material: data.material,
    description: data.description,
    colors: parseColors(data.colors),
    photo_urls: data.photo_urls ?? [],
    category: cat as FrameCategory | null,
  };
}
