"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import { lensTypeSchema, lensAddonSchema } from "@/lib/lens-schemas";
import type { TablesInsert } from "@/db/types";

/**
 * Admin lens-catalogue actions (US-P2-02). Every action begins with requireAdmin()
 * (CLAUDE.md rule 3) and writes through the RLS-gated session client (rule 6) — the
 * `lens_types/lens_addons admin write` Postgres policies are the last line of
 * defence. The PDP + checkout read this catalogue live (PDP is force-dynamic;
 * checkout re-prices per request), so no cache tag is needed.
 */

export type LensFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function firstFieldErrors(
  fieldErrors: Record<string, string[] | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(fieldErrors)) {
    if (msgs && msgs[0]) out[key] = msgs[0];
  }
  return out;
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** GHS string → integer pesewa; NaN flows on garbage so zod rejects it. */
function ghsToPesewa(input: string): number {
  const n = Number.parseFloat(input);
  if (!Number.isFinite(n)) return Number.NaN;
  return Math.round(n * 100);
}

function commonFields(formData: FormData) {
  return {
    name: str(formData, "name"),
    slug: str(formData, "slug"),
    description: str(formData, "description"),
    price_ghs: ghsToPesewa(str(formData, "price_ghs") || "0"),
    sort_order: Number.parseInt(str(formData, "sort_order") || "0", 10),
    is_active: formData.get("is_active") === "on", // checkbox; create form defaults checked
  };
}

function dupOrGeneric(code: string | undefined, verb: string): string {
  return code === "23505"
    ? "An option with that slug already exists."
    : `Could not ${verb}. Please try again.`;
}

function revalidateLenses(): void {
  revalidatePath("/admin/lenses");
}

// ─── Lens types ───────────────────────────────────────────────────────────────

function buildLensTypeRow(formData: FormData): {
  row?: TablesInsert<"lens_types">;
  state?: LensFormState;
} {
  const parsed = lensTypeSchema.safeParse({
    ...commonFields(formData),
    badge: str(formData, "badge"),
  });
  if (!parsed.success) {
    return { state: { fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors) } };
  }
  const d = parsed.data;
  return {
    row: {
      name: d.name,
      slug: d.slug,
      description: d.description || null,
      price_ghs: d.price_ghs,
      badge: d.badge || null,
      sort_order: d.sort_order,
      is_active: d.is_active,
    },
  };
}

export async function createLensType(
  _prev: LensFormState,
  formData: FormData,
): Promise<LensFormState> {
  await requireAdmin();
  const { row, state } = buildLensTypeRow(formData);
  if (state) return state;
  const supabase = await createClient();
  const { error } = await supabase.from("lens_types").insert(row!);
  if (error) return { error: dupOrGeneric(error.code, "create the lens type") };
  revalidateLenses();
  redirect("/admin/lenses");
}

export async function updateLensType(
  _prev: LensFormState,
  formData: FormData,
): Promise<LensFormState> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return { error: "Missing lens type id." };
  const { row, state } = buildLensTypeRow(formData);
  if (state) return state;
  const supabase = await createClient();
  const { error } = await supabase.from("lens_types").update(row!).eq("id", id);
  if (error) return { error: dupOrGeneric(error.code, "update the lens type") };
  revalidateLenses();
  redirect("/admin/lenses");
}

export async function archiveLensType(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("lens_types").update({ is_active: false }).eq("id", id);
  revalidateLenses();
}

export async function restoreLensType(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("lens_types").update({ is_active: true }).eq("id", id);
  revalidateLenses();
}

// ─── Lens add-ons ─────────────────────────────────────────────────────────────

function buildLensAddonRow(formData: FormData): {
  row?: TablesInsert<"lens_addons">;
  state?: LensFormState;
} {
  const parsed = lensAddonSchema.safeParse({
    ...commonFields(formData),
    included: formData.get("included") === "on",
    group: str(formData, "group"),
    single_select: formData.get("single_select") === "on",
  });
  if (!parsed.success) {
    return { state: { fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors) } };
  }
  const d = parsed.data;
  return {
    row: {
      name: d.name,
      slug: d.slug,
      description: d.description || null,
      price_ghs: d.price_ghs,
      included: d.included,
      addon_group: d.group,
      single_select: d.single_select,
      sort_order: d.sort_order,
      is_active: d.is_active,
    },
  };
}

export async function createLensAddon(
  _prev: LensFormState,
  formData: FormData,
): Promise<LensFormState> {
  await requireAdmin();
  const { row, state } = buildLensAddonRow(formData);
  if (state) return state;
  const supabase = await createClient();
  const { error } = await supabase.from("lens_addons").insert(row!);
  if (error) return { error: dupOrGeneric(error.code, "create the add-on") };
  revalidateLenses();
  redirect("/admin/lenses");
}

export async function updateLensAddon(
  _prev: LensFormState,
  formData: FormData,
): Promise<LensFormState> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return { error: "Missing add-on id." };
  const { row, state } = buildLensAddonRow(formData);
  if (state) return state;
  const supabase = await createClient();
  const { error } = await supabase.from("lens_addons").update(row!).eq("id", id);
  if (error) return { error: dupOrGeneric(error.code, "update the add-on") };
  revalidateLenses();
  redirect("/admin/lenses");
}

export async function archiveLensAddon(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("lens_addons").update({ is_active: false }).eq("id", id);
  revalidateLenses();
}

export async function restoreLensAddon(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("lens_addons").update({ is_active: true }).eq("id", id);
  revalidateLenses();
}
