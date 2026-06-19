"use server";

import {
  prescriptionMetaSchema,
  manualRxSchema,
} from "@/lib/prescription-schemas";
import {
  createPrescription,
  createManualPrescription,
} from "@/server/prescriptions";

/**
 * Inline prescription create actions for the PDP lens builder (US-P2-02 follow-up).
 * Both return a plain serializable result (never redirect) so the client panel can
 * capture the new id and attach it to the cart line. The server fns enforce
 * requireUser() + the LUMEN_PRESCRIPTION_UPLOAD_ENABLED flag; the builder only
 * surfaces these to signed-in users, but the guards are the real boundary.
 */

export type InlineRxResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** First message per zod field path, joined with "." (e.g. "right.sph"). */
function fieldErrorsFromIssues(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/** Upload a file inline (mirrors the account upload action's parsing). */
export async function uploadRxInline(formData: FormData): Promise<InlineRxResult> {
  const parsed = prescriptionMetaSchema.safeParse({
    practitioner_name: str(formData, "practitioner_name"),
    issued_on: str(formData, "issued_on"),
    notes: str(formData, "notes"),
    consent: formData.get("consent") === "on" || formData.get("consent") === "true",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the errors below.",
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
    };
  }

  const file = formData.get("file");
  const result = await createPrescription(parsed.data, file instanceof File ? file : null);
  if (!result.ok) {
    return { ok: false, error: result.error, fieldErrors: result.fieldErrors };
  }
  return { ok: true, id: result.id };
}

/** Save a structured manual Rx inline. `input` is a plain serializable object. */
export async function createManualRxInline(input: unknown): Promise<InlineRxResult> {
  const parsed = manualRxSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the errors below.",
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
    };
  }

  const result = await createManualPrescription(parsed.data);
  if (!result.ok) {
    return { ok: false, error: result.error, fieldErrors: result.fieldErrors };
  }
  return { ok: true, id: result.id };
}
