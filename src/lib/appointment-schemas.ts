import { z } from "zod";
import { phoneSchema } from "@/lib/checkout-schemas";

export const APPOINTMENT_SERVICES = [
  "eye-test",
  "contact-lens",
  "glasses-fitting",
  "home-visit",
  "other",
] as const;
export type AppointmentService = (typeof APPOINTMENT_SERVICES)[number];

export const SERVICE_LABELS: Record<AppointmentService, string> = {
  "eye-test": "Eye test",
  "contact-lens": "Contact lens fitting",
  "glasses-fitting": "Glasses fitting",
  "home-visit": "Home visit eye test",
  other: "Other / not sure",
};

export const APPOINTMENT_STATUSES = [
  "requested",
  "confirmed",
  "cancelled",
  "completed",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/**
 * Validate an optional preferred date string (YYYY-MM-DD). Empty string →
 * undefined. Uses the transform+ctx.addIssue pattern from checkout-schemas.ts
 * to avoid pipe() quirks.
 */
const preferredDateSchema = z
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
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid date.",
      });
      return z.NEVER;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Preferred date must be today or in the future.",
      });
      return z.NEVER;
    }
    return v;
  });

export const appointmentSchema = z.object({
  clinic_id: z.string().uuid("Select a clinic."),
  clinic_name: z.string().trim().min(1).max(120),
  service: z.enum(APPOINTMENT_SERVICES, {
    errorMap: () => ({ message: "Select a service." }),
  }),
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(80, "Name is too long."),
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address.")
    .max(254, "Email is too long."),
  preferred_date: preferredDateSchema,
  notes: z
    .string()
    .trim()
    .max(500, "Notes must be 500 characters or fewer.")
    .optional()
    .or(z.literal("")),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;
