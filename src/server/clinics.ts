import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@/server/supabase";
import { createPublicClient } from "@/server/supabase-public";
import { parseOpeningHours, type OpeningHours } from "@/lib/clinic-hours";

/** Public clinic row as rendered on /clinics. */
export type Clinic = {
  id: string;
  slug: string;
  name: string;
  address: string;
  phone: string | null;
  whatsapp: string | null;
  optometrist_count: number;
  services: string[];
  opening_hours: OpeningHours | null;
  is_flagship: boolean;
};

/**
 * Fetch all active clinics ordered by sort_order.
 * RLS "clinics public read" restricts rows to is_active=true for anon;
 * the explicit filter documents intent (and applies for admins too).
 */
export async function getActiveClinics(): Promise<Clinic[]> {
  // No Supabase env (e.g. env-less CI / preview) → empty, so the page renders
  // its empty state instead of throwing in createClient(). Mirrors the guard in
  // getClinicFooterData and the "no-op without env" pattern used elsewhere.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return [];
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinics")
    .select(
      "id, slug, name, address, phone, whatsapp, optometrist_count, services, opening_hours, is_flagship",
    )
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error("[clinics] getActiveClinics error", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    address: row.address,
    phone: row.phone,
    whatsapp: row.whatsapp,
    optometrist_count: row.optometrist_count,
    services: row.services ?? [],
    opening_hours: parseOpeningHours(row.opening_hours),
    is_flagship: row.is_flagship,
  }));
}

/** Lightweight clinic data for the site footer. */
export type ClinicFooterData = {
  clinics: { slug: string; name: string }[];
  count: number;
  cities: string[];
};

/** Derive the city from an address ("12 Lagos Avenue, East Legon, Accra" → "Accra"). */
function cityFromAddress(address: string): string | null {
  const last = address.split(",").at(-1)?.trim();
  return last && last.length > 0 ? last : null;
}

/**
 * Active clinic names + count + distinct cities for shared chrome.
 * Uses the cookie-less public client so static pages stay static, and is
 * cached under the "clinics" tag — admin clinic actions bust it via
 * revalidateTag("clinics").
 */
export const getClinicFooterData = unstable_cache(
  async (): Promise<ClinicFooterData> => {
    // No Supabase env (e.g. bare CI/Lighthouse builds) → empty, render fallback.
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ) {
      return { clinics: [], count: 0, cities: [] };
    }
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("clinics")
      .select("slug, name, address")
      .eq("is_active", true)
      .order("sort_order");

    if (error) {
      console.error("[clinics] getClinicFooterData error", error.message);
      return { clinics: [], count: 0, cities: [] };
    }

    const rows = data ?? [];
    const cities = [
      ...new Set(
        rows
          .map((row) => cityFromAddress(row.address))
          .filter((city): city is string => city !== null),
      ),
    ];

    return {
      clinics: rows.map(({ slug, name }) => ({ slug, name })),
      count: rows.length,
      cities,
    };
  },
  ["clinic-footer-data"],
  { tags: ["clinics"], revalidate: 3600 },
);
