import { z } from "zod";
import { normalizeGhanaPhone } from "@/lib/checkout-schemas";
import { DAY_KEYS } from "@/lib/clinic-hours";

/**
 * Clinic validation for the admin CRUD (US-P0-09 / pulled forward from
 * US-P2-04). Single source of truth, re-validated server-side inside every
 * admin clinic action — the client form reuses these for UX only, never as
 * the security boundary.
 */

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter a slug.")
  .max(80, "Slug is too long.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug may use lowercase letters, numbers and single hyphens only.",
  );

/** Optional Ghana phone — empty becomes null, anything else must normalise to E.164. */
const optionalPhoneSchema = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === "") return null;
    const normalized = normalizeGhanaPhone(v);
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid Ghana phone number.",
      });
      return z.NEVER;
    }
    return normalized;
  });

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const timeSchema = z
  .string()
  .regex(TIME_RE, "Use 24h HH:MM times.")
  .nullable();

const dayHoursSchema = z
  .object({
    open: timeSchema,
    close: timeSchema,
    closed: z.boolean(),
  })
  .superRefine((day, ctx) => {
    if (day.closed) return;
    if (day.open === null || day.close === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Set open and close times, or mark the day closed.",
      });
      return;
    }
    if (day.open >= day.close) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Closing time must be after opening time.",
      });
    }
  })
  // Normalise: a closed day never stores stale times.
  .transform((day) =>
    day.closed ? { open: null, close: null, closed: true } : day,
  );

export const openingHoursSchema = z.object(
  Object.fromEntries(DAY_KEYS.map((key) => [key, dayHoursSchema])) as Record<
    (typeof DAY_KEYS)[number],
    typeof dayHoursSchema
  >,
);

export const clinicSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(120, "Name is too long."),
  slug: slugSchema,
  address: z
    .string()
    .trim()
    .min(1, "Enter an address.")
    .max(300, "Address is too long."),
  phone: optionalPhoneSchema,
  whatsapp: optionalPhoneSchema,
  optometrist_count: z
    .number({ message: "Enter the optometrist count." })
    .int("Must be a whole number.")
    .min(0, "Cannot be negative.")
    .max(50, "That's too many."),
  services: z
    .array(z.string().trim().min(1, "Service needs a name.").max(60))
    .max(12, "Too many services."),
  opening_hours: openingHoursSchema,
  is_flagship: z.boolean(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  sort_order: z
    .number({ message: "Enter a sort order." })
    .int("Must be a whole number.")
    .min(0, "Cannot be negative.")
    .max(999),
});

export type ClinicInput = z.infer<typeof clinicSchema>;
