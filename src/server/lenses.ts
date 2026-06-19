import "server-only";
import { createClient } from "@/server/supabase";
import type {
  LensCatalogueView,
  LensTypeView,
  LensAddonView,
} from "@/lib/lens-catalogue";

/**
 * Lens catalogue data layer (US-P2-02). Reads the active lens_types + lens_addons
 * via the RLS-gated client (both have a public-read policy), ordered for the
 * builder. Admin edits reflect on the PDP immediately (the PDP is force-dynamic).
 */
export async function getLensCatalogue(): Promise<LensCatalogueView> {
  const supabase = await createClient();
  const [typesRes, addonsRes] = await Promise.all([
    supabase
      .from("lens_types")
      .select("slug, name, description, price_ghs, badge")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("lens_addons")
      .select("slug, name, description, price_ghs, included, addon_group, single_select")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  if (typesRes.error || addonsRes.error) {
    console.error(
      "[lenses] getLensCatalogue error",
      typesRes.error?.message ?? addonsRes.error?.message,
    );
    return { lensTypes: [], addons: [] };
  }

  return {
    lensTypes: (typesRes.data ?? []) as LensTypeView[],
    // Map the DB column names (addon_group / single_select) onto the view's
    // camelCase group / singleSelect.
    addons: (addonsRes.data ?? []).map((a) => ({
      slug: a.slug,
      name: a.name,
      description: a.description,
      price_ghs: a.price_ghs,
      included: a.included,
      group: a.addon_group,
      singleSelect: a.single_select,
    })) satisfies LensAddonView[],
  };
}
