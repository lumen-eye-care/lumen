"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import {
  frameSchema,
  FRAME_IMAGE_MIME,
  FRAME_IMAGE_MAX_BYTES,
} from "@/lib/frame-schemas";
import type { TablesInsert } from "@/db/types";

/**
 * Admin frame catalogue actions (US-P1-07). Every action begins with
 * requireAdmin() (CLAUDE.md rule 3) and writes through the RLS-gated session
 * client (rule 6) — the `frames admin write` Postgres policy is the last line of
 * defence, so a bypassed handler still can't write. The secret-key client is
 * never used here. revalidatePath() refreshes the storefront after each write.
 */

export type FrameFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
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

function emptyToNull(v: string): string | null {
  return v === "" ? null : v;
}

/** Parse the price field (entered in GHS) into integer pesewa. NaN if invalid. */
function ghsToPesewa(input: string): number {
  const n = Number.parseFloat(input);
  if (!Number.isFinite(n)) return Number.NaN;
  return Math.round(n * 100);
}

/** Safe-parse a JSON array field from the form; returns [] on any failure. */
function parseJsonArray(raw: string): unknown[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Upload any newly-attached photo Files to the public `frames` bucket. */
async function uploadPhotos(
  supabase: SupabaseServer,
  slug: string,
  files: File[],
): Promise<{ urls?: string[]; error?: string }> {
  const urls: string[] = [];
  for (const file of files) {
    if (!file || file.size === 0) continue;
    if (!FRAME_IMAGE_MIME.includes(file.type as (typeof FRAME_IMAGE_MIME)[number])) {
      return { error: `Unsupported image type: ${file.type || "unknown"}.` };
    }
    if (file.size > FRAME_IMAGE_MAX_BYTES) {
      return { error: "Each image must be 5 MB or smaller." };
    }
    const ext = MIME_EXT[file.type] ?? "jpg";
    const path = `${slug}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("frames")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      return { error: `Image upload failed: ${error.message}` };
    }
    urls.push(supabase.storage.from("frames").getPublicUrl(path).data.publicUrl);
  }
  return { urls };
}

/** Shared build + validate. Returns either a clean row or a form-error state. */
async function buildFrameRow(
  supabase: SupabaseServer,
  formData: FormData,
): Promise<{ row?: TablesInsert<"frames">; state?: FrameFormState }> {
  const slug = str(formData, "slug");

  const keptPhotos = parseJsonArray(str(formData, "existing_photo_urls")).filter(
    (u): u is string => typeof u === "string",
  );
  const newFiles = formData.getAll("photos").filter((f): f is File => f instanceof File);

  const uploaded = await uploadPhotos(supabase, slug || "frame", newFiles);
  if (uploaded.error) return { state: { error: uploaded.error } };

  const candidate = {
    name: str(formData, "name"),
    slug,
    price_ghs: ghsToPesewa(str(formData, "price_ghs")),
    stock: Number.parseInt(str(formData, "stock") || "0", 10),
    category_id: emptyToNull(str(formData, "category_id")),
    description: str(formData, "description"),
    shape: emptyToNull(str(formData, "shape")),
    gender: emptyToNull(str(formData, "gender")),
    material: str(formData, "material"),
    badge: emptyToNull(str(formData, "badge")),
    colors: parseJsonArray(str(formData, "colors")),
    photo_urls: [...keptPhotos, ...(uploaded.urls ?? [])],
  };

  const parsed = frameSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      state: { fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors) },
    };
  }

  const d = parsed.data;
  const row: TablesInsert<"frames"> = {
    name: d.name,
    slug: d.slug,
    price_ghs: d.price_ghs,
    stock: d.stock,
    category_id: d.category_id,
    description: d.description ? d.description : null,
    shape: d.shape,
    gender: d.gender,
    material: d.material ? d.material : null,
    badge: d.badge,
    colors: d.colors,
    photo_urls: d.photo_urls,
  };
  return { row };
}

function revalidateStorefront(): void {
  revalidatePath("/shop");
  revalidatePath("/admin/frames");
}

export async function createFrame(
  _prev: FrameFormState,
  formData: FormData,
): Promise<FrameFormState> {
  await requireAdmin();
  const supabase = await createClient();

  const { row, state } = await buildFrameRow(supabase, formData);
  if (state) return state;

  const { error } = await supabase.from("frames").insert(row!);
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "A frame with that slug already exists."
          : "Could not create the frame. Please try again.",
    };
  }

  revalidateStorefront();
  redirect("/admin/frames");
}

export async function updateFrame(
  _prev: FrameFormState,
  formData: FormData,
): Promise<FrameFormState> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return { error: "Missing frame id." };

  const supabase = await createClient();
  const { row, state } = await buildFrameRow(supabase, formData);
  if (state) return state;

  const { error } = await supabase.from("frames").update(row!).eq("id", id);
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "A frame with that slug already exists."
          : "Could not update the frame. Please try again.",
    };
  }

  revalidateStorefront();
  redirect("/admin/frames");
}

/** Soft-delete: archived frames stay in the DB so order_items history survives. */
export async function archiveFrame(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("frames").update({ is_active: false }).eq("id", id);
  revalidateStorefront();
}

export async function restoreFrame(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("frames").update({ is_active: true }).eq("id", id);
  revalidateStorefront();
}
