"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import { clinicSchema } from "@/lib/clinic-schemas";
import type { TablesInsert } from "@/db/types";

/**
 * Admin clinic actions (US-P0-09; pulled forward from US-P2-04). Every action
 * begins with requireAdmin() (CLAUDE.md rule 3) and writes through the
 * RLS-gated session client (rule 6) — the `clinics admin write` Postgres
 * policy is the last line of defence. The secret-key client is never used.
 */

export type ClinicFormState = {
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

/** Optional decimal field → number | null; NaN flows on garbage so zod rejects it. */
function toNullableNumber(input: string): number | null {
  if (input === "") return null;
  return Number.parseFloat(input);
}

/** Safe-parse a JSON field from the form; returns the fallback on any failure. */
function parseJson(raw: string): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Shared build + validate. Returns either a clean row or a form-error state. */
function buildClinicRow(formData: FormData): {
  row?: TablesInsert<"clinics">;
  state?: ClinicFormState;
} {
  const rawServices = parseJson(str(formData, "services"));
  const candidate = {
    name: str(formData, "name"),
    slug: str(formData, "slug"),
    address: str(formData, "address"),
    phone: str(formData, "phone"),
    whatsapp: str(formData, "whatsapp"),
    optometrist_count: Number.parseInt(
      str(formData, "optometrist_count") || "0",
      10,
    ),
    services: Array.isArray(rawServices) ? rawServices : [],
    opening_hours: parseJson(str(formData, "opening_hours")),
    is_flagship: formData.get("is_flagship") === "on",
    latitude: toNullableNumber(str(formData, "latitude")),
    longitude: toNullableNumber(str(formData, "longitude")),
    sort_order: Number.parseInt(str(formData, "sort_order") || "0", 10),
  };

  const parsed = clinicSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      state: {
        fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors),
      },
    };
  }

  const d = parsed.data;
  const row: TablesInsert<"clinics"> = {
    name: d.name,
    slug: d.slug,
    address: d.address,
    phone: d.phone,
    whatsapp: d.whatsapp,
    optometrist_count: d.optometrist_count,
    services: d.services,
    opening_hours: d.opening_hours,
    is_flagship: d.is_flagship,
    latitude: d.latitude,
    longitude: d.longitude,
    sort_order: d.sort_order,
  };
  return { row };
}

function revalidateClinics(): void {
  revalidatePath("/clinics");
  revalidatePath("/admin/clinics");
  // Busts the cached footer data (src/server/clinics.ts getClinicFooterData).
  // Next 16 signature: the "max" profile expires the tag immediately for
  // all readers (the pre-16 revalidateTag behaviour).
  revalidateTag("clinics", "max");
}

export async function createClinic(
  _prev: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  await requireAdmin();
  const { row, state } = buildClinicRow(formData);
  if (state) return state;

  const supabase = await createClient();
  const { error } = await supabase.from("clinics").insert(row!);
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "A clinic with that slug already exists."
          : "Could not create the clinic. Please try again.",
    };
  }

  revalidateClinics();
  redirect("/admin/clinics");
}

export async function updateClinic(
  _prev: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return { error: "Missing clinic id." };

  const { row, state } = buildClinicRow(formData);
  if (state) return state;

  const supabase = await createClient();
  const { error } = await supabase.from("clinics").update(row!).eq("id", id);
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "A clinic with that slug already exists."
          : "Could not update the clinic. Please try again.",
    };
  }

  revalidateClinics();
  redirect("/admin/clinics");
}

/** Soft-delete: archived clinics disappear from /clinics + footer but keep history. */
export async function archiveClinic(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("clinics").update({ is_active: false }).eq("id", id);
  revalidateClinics();
}

export async function restoreClinic(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("clinics").update({ is_active: true }).eq("id", id);
  revalidateClinics();
}
