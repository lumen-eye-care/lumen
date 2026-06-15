import "server-only";
import { requireUser, requireAdmin } from "@/server/auth-guards";
import { createClient } from "@/server/supabase";
import { getSupabaseAdmin } from "@/server/supabase-admin";
import {
  PRESCRIPTION_MIME_EXT,
  validatePrescriptionFile,
  type PrescriptionMetaInput,
  type PrescriptionStatus,
} from "@/lib/prescription-schemas";

/**
 * Prescription data layer (US-P1-03). Health data — strictest handling:
 *  - Owner reads/writes go through the RLS client (`createClient`) with an
 *    explicit `.eq('user_id', …)` filter (the table carries an admin-all policy,
 *    so RLS alone would surface every row to an admin — see
 *    [[rls-admin-all-policy-needs-explicit-owner-filter]]).
 *  - The secret-key client (`getSupabaseAdmin`) is used ONLY to mint short-lived
 *    signed URLs for the private bucket and to write the append-only access log
 *    (CLAUDE.md rules 5 & 7). The audit log has no auth-user insert policy.
 *  - The whole feature is gated by LUMEN_PRESCRIPTION_UPLOAD_ENABLED; when off,
 *    writes/reads no-op and the route 404s.
 */

const BUCKET = "prescriptions";
const SIGNED_URL_TTL_SECONDS = 3600; // 1 hour (CLAUDE.md rule 7)

/** Feature gate. Read process.env directly (not getEnv) so the module works
 * without the full secret set, mirroring src/lib/frame-3d.ts. */
export function prescriptionUploadEnabled(): boolean {
  return process.env.LUMEN_PRESCRIPTION_UPLOAD_ENABLED === "true";
}

function hasSupabaseEnv(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

export type PrescriptionRow = {
  id: string;
  user_id: string;
  file_path: string;
  original_name: string | null;
  mime_type: string;
  size_bytes: number;
  status: string;
  practitioner_name: string | null;
  issued_on: string | null;
  notes: string | null;
  review_notes: string | null;
  created_at: string;
};

const ROW_COLUMNS =
  "id, user_id, file_path, original_name, mime_type, size_bytes, status, practitioner_name, issued_on, notes, review_notes, created_at";

export type CreatePrescriptionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Write the audit trail via the secret-key client (the only client that can
 * insert — there's no auth-user insert policy on the log). Best-effort: a log
 * failure must not surface PII or block the primary action, but we record it.
 */
async function logAccess(params: {
  actorId: string;
  prescriptionId: string;
  action: "upload" | "read" | "delete";
  reason?: string;
}): Promise<void> {
  try {
    await getSupabaseAdmin()
      .from("prescription_access_log")
      .insert({
        actor_id: params.actorId,
        prescription_id: params.prescriptionId,
        action: params.action,
        reason: params.reason ?? null,
      });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[prescriptions] access-log write failed (non-fatal)", err);
    }
  }
}

/**
 * Upload a prescription file + metadata for the signed-in user.
 * requireUser → validate file → upload to `<user_id>/<uuid>.<ext>` (RLS client,
 * owner-insert storage policy) → insert metadata row with consent_at=now (RLS
 * client) → audit 'upload'. On storage failure nothing is inserted; on row
 * failure we remove the orphaned object.
 */
export async function createPrescription(
  meta: PrescriptionMetaInput,
  file: File | null,
): Promise<CreatePrescriptionResult> {
  if (!prescriptionUploadEnabled()) {
    return { ok: false, error: "Prescription upload is not available." };
  }
  if (!hasSupabaseEnv()) {
    return { ok: false, error: "Service temporarily unavailable." };
  }

  const user = await requireUser();

  const fileCheck = validatePrescriptionFile(file);
  if (!fileCheck.ok) {
    return { ok: false, error: fileCheck.error, fieldErrors: { file: fileCheck.error } };
  }
  // Narrowed by validatePrescriptionFile.
  const validFile = file as File;

  const supabase = await createClient();
  const ext = PRESCRIPTION_MIME_EXT[fileCheck.mime];
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, validFile, { contentType: fileCheck.mime, upsert: false });
  if (uploadError) {
    return { ok: false, error: "Upload failed. Please try again." };
  }

  const { data, error: insertError } = await supabase
    .from("prescriptions")
    .insert({
      user_id: user.id,
      file_path: path,
      original_name: validFile.name || null,
      mime_type: fileCheck.mime,
      size_bytes: validFile.size,
      practitioner_name: meta.practitioner_name ? meta.practitioner_name : null,
      issued_on: meta.issued_on ?? null,
      notes: meta.notes ? meta.notes : null,
      consent_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !data) {
    // Roll back the orphaned object so we never keep a file without a record.
    await supabase.storage.from(BUCKET).remove([path]);
    return { ok: false, error: "Could not save your prescription. Please try again." };
  }

  await logAccess({ actorId: user.id, prescriptionId: data.id, action: "upload" });
  return { ok: true, id: data.id };
}

/** The signed-in user's own prescriptions, newest first. Owner-scoped explicitly. */
export async function listOwnPrescriptions(): Promise<PrescriptionRow[]> {
  if (!prescriptionUploadEnabled() || !hasSupabaseEnv()) return [];
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prescriptions")
    .select(ROW_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[prescriptions] listOwnPrescriptions error", error.message);
    return [];
  }
  return (data ?? []) as PrescriptionRow[];
}

export type PrescriptionsSummary = {
  total: number;
  pending: number;
  verified: number;
};

/**
 * Lightweight owner-scoped counts for the account dashboard tile. We surface a
 * COUNT (+ status breakdown), never Rx values — v1 is upload-only, no structured
 * Rx fields (that's US-P2-02). Flag/env guarded → zeros when unavailable.
 */
export async function getOwnPrescriptionsSummary(): Promise<PrescriptionsSummary> {
  const empty = { total: 0, pending: 0, verified: 0 };
  if (!prescriptionUploadEnabled() || !hasSupabaseEnv()) return empty;
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prescriptions")
    .select("status")
    .eq("user_id", user.id);
  if (error) {
    console.error("[prescriptions] getOwnPrescriptionsSummary error", error.message);
    return empty;
  }
  const rows = data ?? [];
  return {
    total: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
    verified: rows.filter((r) => r.status === "verified").length,
  };
}

/**
 * Mint a 1-hour signed URL for a prescription file and log the read. Ownership
 * is enforced by RLS on the metadata read (owner OR admin); the secret-key
 * client only generates the URL after that check passes. Returns null if the
 * caller can't see the row.
 */
export async function getPrescriptionSignedUrl(
  prescriptionId: string,
  reason: string,
): Promise<string | null> {
  if (!prescriptionUploadEnabled() || !hasSupabaseEnv()) return null;
  const user = await requireUser();

  // RLS-gated read: only the owner or an admin can load the row → its path.
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("prescriptions")
    .select("id, file_path")
    .eq("id", prescriptionId)
    .maybeSingle();
  if (error || !row) return null;

  const { data: signed, error: signError } = await getSupabaseAdmin()
    .storage.from(BUCKET)
    .createSignedUrl(row.file_path, SIGNED_URL_TTL_SECONDS);
  if (signError || !signed) return null;

  await logAccess({
    actorId: user.id,
    prescriptionId: row.id,
    action: "read",
    reason,
  });
  return signed.signedUrl;
}

// ---------------------------------------------------------------------------
// Admin (review queue). requireAdmin() in every entry point (CLAUDE.md rule 3).
// ---------------------------------------------------------------------------

export type AdminPrescriptionRow = PrescriptionRow & {
  customer_email: string | null;
  customer_name: string | null;
};

const ADMIN_ROW_COLUMNS = `${ROW_COLUMNS}, users:user_id (email, name)`;

type AdminJoinRow = PrescriptionRow & {
  users: { email: string | null; name: string | null } | null;
};

function flattenAdminRow(r: AdminJoinRow): AdminPrescriptionRow {
  const { users, ...rest } = r;
  return { ...rest, customer_email: users?.email ?? null, customer_name: users?.name ?? null };
}

/** Admin: list prescriptions, optionally filtered by status. */
export async function listPrescriptions(
  status?: PrescriptionStatus,
): Promise<AdminPrescriptionRow[]> {
  await requireAdmin();
  const supabase = await createClient();
  let query = supabase
    .from("prescriptions")
    .select(ADMIN_ROW_COLUMNS)
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    console.error("[prescriptions] listPrescriptions error", error.message);
    return [];
  }
  return ((data ?? []) as unknown as AdminJoinRow[]).map(flattenAdminRow);
}

/** Admin: single prescription detail. */
export async function getPrescription(
  id: string,
): Promise<AdminPrescriptionRow | null> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prescriptions")
    .select(ADMIN_ROW_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return flattenAdminRow(data as unknown as AdminJoinRow);
}

/** Admin: verify or reject a prescription, with an optional review note. */
export async function setPrescriptionStatus(
  id: string,
  status: PrescriptionStatus,
  reviewNotes: string | null,
): Promise<{ ok: boolean }> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("prescriptions")
    .update({ status, review_notes: reviewNotes })
    .eq("id", id);
  if (error) {
    console.error("[prescriptions] setPrescriptionStatus error", error.message);
    return { ok: false };
  }
  return { ok: true };
}
