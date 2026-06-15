import { z } from "zod";

/**
 * Prescription upload validation (US-P1-03). Two parts:
 *  - the uploaded File (mime + size) — validated by the pure `validatePrescriptionFile`
 *    helper, mirroring the admin frames upload guard (src/app/admin/frames/actions.ts);
 *  - the accompanying metadata + consent — validated by `prescriptionMetaSchema`.
 *
 * Upload-only: no OCR / structured Rx fields (those are US-P2-02).
 */

export const PRESCRIPTION_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;
export type PrescriptionMime = (typeof PRESCRIPTION_MIME)[number];

/** Map a validated mime type to a file extension for the stored object key. */
export const PRESCRIPTION_MIME_EXT: Record<PrescriptionMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/** 5 MB — tighter than the 10 MB bucket guard, per the design copy. */
export const PRESCRIPTION_MAX_BYTES = 5 * 1024 * 1024;

export const PRESCRIPTION_STATUSES = ["pending", "verified", "rejected"] as const;
export type PrescriptionStatus = (typeof PRESCRIPTION_STATUSES)[number];

export type FileValidationResult =
  | { ok: true; mime: PrescriptionMime }
  | { ok: false; error: string };

/**
 * Validate an uploaded prescription file: present, non-empty, an allowed mime,
 * within the size cap. Returns the narrowed mime on success so the caller can
 * derive the extension without re-checking.
 */
export function validatePrescriptionFile(file: File | null): FileValidationResult {
  if (!file || file.size === 0) {
    return { ok: false, error: "Choose a photo or PDF of your prescription." };
  }
  if (!PRESCRIPTION_MIME.includes(file.type as PrescriptionMime)) {
    return {
      ok: false,
      error: "Upload a JPG, PNG, WebP image or a PDF.",
    };
  }
  if (file.size > PRESCRIPTION_MAX_BYTES) {
    return { ok: false, error: "File must be 5 MB or smaller." };
  }
  return { ok: true, mime: file.type as PrescriptionMime };
}

/**
 * Optional issue date (YYYY-MM-DD). Empty → undefined. Rejects a future date;
 * a date older than 12 months is allowed (the UI warns, it doesn't block — an
 * old Rx may still be on file). Mirrors the transform+ctx.addIssue pattern from
 * appointment-schemas.ts.
 */
const issuedOnSchema = z
  .string()
  .optional()
  .transform((v, ctx): string | undefined => {
    if (!v || v === "") return undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a date as YYYY-MM-DD.",
      });
      return z.NEVER;
    }
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid date." });
      return z.NEVER;
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (d > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Issue date can't be in the future.",
      });
      return z.NEVER;
    }
    return v;
  });

/** True if an issue date is more than 12 months ago (UI shows a soft warning). */
export function isStaleIssueDate(issuedOn: string | null | undefined, now = new Date()): boolean {
  if (!issuedOn) return false;
  const d = new Date(issuedOn);
  if (Number.isNaN(d.getTime())) return false;
  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  return d < cutoff;
}

export const prescriptionMetaSchema = z.object({
  practitioner_name: z
    .string()
    .trim()
    .max(120, "Practitioner name is too long.")
    .optional()
    .or(z.literal("")),
  issued_on: issuedOnSchema,
  notes: z
    .string()
    .trim()
    .max(500, "Notes must be 500 characters or fewer.")
    .optional()
    .or(z.literal("")),
  // Must be ticked — the server rejects otherwise (don't store without consent).
  consent: z.literal(true, "You must confirm consent to upload your prescription."),
});

export type PrescriptionMetaInput = z.infer<typeof prescriptionMetaSchema>;
