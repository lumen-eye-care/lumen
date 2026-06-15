"use server";

import { revalidatePath } from "next/cache";
import { prescriptionMetaSchema } from "@/lib/prescription-schemas";
import {
  createPrescription,
  getPrescriptionSignedUrl,
} from "@/server/prescriptions";

export type PrescriptionFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; error: string; fieldErrors?: Record<string, string> };

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function firstFieldErrors(
  fieldErrors: Record<string, string[] | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(fieldErrors)) {
    if (msgs?.[0]) out[key] = msgs[0];
  }
  return out;
}

export async function uploadPrescription(
  _prev: PrescriptionFormState,
  formData: FormData,
): Promise<PrescriptionFormState> {
  const parsed = prescriptionMetaSchema.safeParse({
    practitioner_name: str(formData, "practitioner_name"),
    issued_on: str(formData, "issued_on"),
    notes: str(formData, "notes"),
    // Checkbox: present only when ticked.
    consent: formData.get("consent") === "on" || formData.get("consent") === "true",
  });
  if (!parsed.success) {
    return {
      status: "error",
      error: "Please correct the errors below.",
      fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }

  const file = formData.get("file");
  const result = await createPrescription(
    parsed.data,
    file instanceof File ? file : null,
  );
  if (!result.ok) {
    return { status: "error", error: result.error, fieldErrors: result.fieldErrors };
  }

  revalidatePath("/account/prescriptions");
  return { status: "success" };
}

/**
 * Mint a fresh 1-hour signed URL for one of the user's prescriptions (every
 * access is audit-logged server-side). Returns the URL for the client to open in
 * a new tab. RLS guarantees a user can only mint URLs for their own files.
 */
export async function getOwnPrescriptionUrl(
  id: string,
): Promise<{ url?: string; error?: string }> {
  if (!id) return { error: "Missing prescription." };
  const url = await getPrescriptionSignedUrl(id, "customer-view");
  return url ? { url } : { error: "Could not open the file." };
}
