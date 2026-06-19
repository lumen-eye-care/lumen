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

const practitionerNameField = z
  .string()
  .trim()
  .max(120, "Practitioner name is too long.")
  .optional()
  .or(z.literal(""));

const notesField = z
  .string()
  .trim()
  .max(500, "Notes must be 500 characters or fewer.")
  .optional()
  .or(z.literal(""));

export const prescriptionMetaSchema = z.object({
  practitioner_name: practitionerNameField,
  issued_on: issuedOnSchema,
  notes: notesField,
  // Must be ticked — the server rejects otherwise (don't store without consent).
  consent: z.literal(true, "You must confirm consent to upload your prescription."),
});

export type PrescriptionMetaInput = z.infer<typeof prescriptionMetaSchema>;

// ---------------------------------------------------------------------------
// Manual Rx entry (US-P2-02 follow-up). Lets a customer type their prescription
// instead of uploading a file. Values are HEALTH DATA — stored in
// prescriptions.rx_values (jsonb) behind LUMEN_PRESCRIPTION_UPLOAD_ENABLED.
//
// Inputs arrive as strings (from number inputs). Each field validates its
// optical range + 0.25-dioptre step (axis is a whole-degree 0–180); empty
// optional fields normalise to undefined → null when stored.
// ---------------------------------------------------------------------------

type DioptreOpts = { min: number; max: number; label: string };

/** Validate a non-empty dioptre string into a number (range + 0.25 step). */
function checkDioptre(
  v: string,
  ctx: z.RefinementCtx,
  opts: DioptreOpts,
): number | typeof z.NEVER {
  const n = Number(v);
  if (!Number.isFinite(n)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Enter a number for ${opts.label}.` });
    return z.NEVER;
  }
  if (n < opts.min || n > opts.max) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${opts.label} must be between ${opts.min} and ${opts.max}.`,
    });
    return z.NEVER;
  }
  // 0.25 dioptre steps (work in integer hundredths to dodge float error).
  if (Math.round(n * 100) % 25 !== 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${opts.label} must be in steps of 0.25.`,
    });
    return z.NEVER;
  }
  return n;
}

/** An optional signed dioptre value (CYL/ADD). Empty → undefined. */
function dioptreField(opts: DioptreOpts) {
  return z
    .string()
    .trim()
    .optional()
    .transform((v, ctx): number | undefined =>
      v ? checkDioptre(v, ctx, opts) : undefined,
    );
}

/** A required signed dioptre value (SPH). Empty → validation error. */
function requiredDioptreField(opts: DioptreOpts) {
  return z
    .string()
    .trim()
    .optional()
    .transform((v, ctx): number => {
      if (!v) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Enter ${opts.label}.` });
        return z.NEVER;
      }
      return checkDioptre(v, ctx, opts);
    });
}

/** Cylinder axis: a whole degree 0–180. Empty → undefined. */
const axisField = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx): number | undefined => {
    if (!v) return undefined;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0 || n > 180) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Axis must be a whole number 0–180." });
      return z.NEVER;
    }
    return n;
  });

/** Pupillary distance in millimetres (40–80, 0.5 steps). Optional. */
const pdField = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx): number | undefined => {
    if (!v) return undefined;
    const n = Number(v);
    if (!Number.isFinite(n)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a number for PD." });
      return z.NEVER;
    }
    if (n < 40 || n > 80) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "PD must be between 40 and 80 mm." });
      return z.NEVER;
    }
    if (Math.round(n * 10) % 5 !== 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "PD must be in steps of 0.5." });
      return z.NEVER;
    }
    return n;
  });

/** One eye's values. SPH is required; CYL and AXIS must be given together. */
const eyeRxSchema = z
  .object({
    sph: requiredDioptreField({ min: -20, max: 20, label: "sphere (SPH)" }),
    cyl: dioptreField({ min: -10, max: 10, label: "cylinder (CYL)" }),
    axis: axisField,
    add: dioptreField({ min: 0, max: 4, label: "add (ADD)" }),
  })
  .superRefine((eye, ctx) => {
    const hasCyl = eye.cyl !== undefined;
    const hasAxis = eye.axis !== undefined;
    if (hasCyl && !hasAxis) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["axis"],
        message: "Enter an axis (0–180) for the cylinder.",
      });
    }
    if (hasAxis && !hasCyl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cyl"],
        message: "Enter a cylinder value for the axis.",
      });
    }
  });

export const manualRxSchema = z.object({
  right: eyeRxSchema,
  left: eyeRxSchema,
  pd: pdField,
  practitioner_name: practitionerNameField,
  issued_on: issuedOnSchema,
  notes: notesField,
  consent: z.literal(true, "You must confirm consent to save your prescription."),
});

export type ManualRxInput = z.infer<typeof manualRxSchema>;

/** The jsonb shape persisted to prescriptions.rx_values (omitted → null). */
export type RxEye = {
  sph: number;
  cyl: number | null;
  axis: number | null;
  add: number | null;
};
export type RxValues = {
  right: RxEye;
  left: RxEye;
  pd: number | null;
};

/** Normalise validated manual input into the stored rx_values shape. */
export function toRxValues(input: ManualRxInput): RxValues {
  const eye = (e: ManualRxInput["right"]): RxEye => ({
    sph: e.sph,
    cyl: e.cyl ?? null,
    axis: e.axis ?? null,
    add: e.add ?? null,
  });
  return { right: eye(input.right), left: eye(input.left), pd: input.pd ?? null };
}
