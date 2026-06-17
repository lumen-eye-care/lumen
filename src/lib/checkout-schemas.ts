import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Checkout input validation (US-P0-05/06/07). Single source of truth, re-validated
 * server-side in /api/checkout/initiate and the COD action — client forms reuse
 * these for UX only, never as the security boundary.
 *
 * Cart prices are deliberately ABSENT here: a line carries only identifiers
 * ({ frameId, colorName, qty } + lens slugs). The server re-derives every price
 * from the DB — frame AND lens (see src/server/checkout.ts).
 */

/**
 * Normalise a Ghana phone number to E.164 (+233...). Accepts local `0XX...` and
 * `+233XX...` (CLAUDE.md). Returns null for anything not a valid Ghana number.
 */
export function normalizeGhanaPhone(input: string): string | null {
  const parsed = parsePhoneNumberFromString(input, "GH");
  if (!parsed || !parsed.isValid() || parsed.country !== "GH") return null;
  return parsed.number; // E.164
}

export const PAYMENT_METHODS = ["momo", "card", "cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Enter a phone number.")
  .transform((v, ctx) => {
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

export const deliverySchema = z.object({
  name: z.string().trim().min(1, "Enter the recipient's name.").max(80, "Name is too long."),
  phone: phoneSchema,
  city: z.string().trim().min(1, "Enter a city or town.").max(80, "City is too long."),
  address: z
    .string()
    .trim()
    .min(1, "Enter a delivery address.")
    .max(300, "Address is too long."),
  // Landmark is optional but recommended (Ghana addresses are landmark-led).
  landmark: z.string().trim().max(200, "Landmark is too long.").optional().or(z.literal("")),
});

// How the customer is supplying their prescription for a built line. `later` and
// `onfile` carry no new health data; `onfile`/`upload`/`manual` set prescriptionId.
export const RX_METHODS = ["later", "onfile", "upload", "manual"] as const;
export type RxMethod = (typeof RX_METHODS)[number];

// Lens build attached to a line. All optional so a plain frame-only line still
// validates; slugs are resolved + priced server-side against the DB catalogue.
const slug = z.string().trim().min(1).max(60);
export const lensSelectionSchema = z.object({
  lensTypeSlug: slug.optional(),
  addonSlugs: z.array(slug).max(20).optional().default([]),
  rxMethod: z.enum(RX_METHODS).optional(),
  prescriptionId: z.string().uuid().optional(),
});

export const cartLineSchema = z.object({
  frameId: z.string().uuid("Invalid frame."),
  colorName: z.string().trim().min(1).max(60),
  qty: z.number().int().positive().max(20),
  lens: lensSelectionSchema.optional(),
});

export const checkoutSchema = z.object({
  delivery: deliverySchema,
  method: z.enum(PAYMENT_METHODS),
  lines: z.array(cartLineSchema).min(1, "Your bag is empty."),
});

export type DeliveryInput = z.infer<typeof deliverySchema>;
export type LensSelectionInput = z.infer<typeof lensSelectionSchema>;
export type CartLineInput = z.infer<typeof cartLineSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
