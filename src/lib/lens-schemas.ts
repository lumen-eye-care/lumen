import { z } from "zod";

/**
 * Lens catalogue validation (US-P2-02 admin). Single source of truth, re-validated
 * server-side in every admin lens action — the client form reuses these for UX only,
 * never as the security boundary.
 *
 * Money note: the admin form collects price in GHS for usability; the action
 * converts to integer pesewa (1 GHS = 100 pesewa) before this schema sees it.
 * price_ghs allows 0 — "included" options (anti-reflective, etc.) are free.
 */

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter a slug.")
  .max(60, "Slug is too long.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug may use lowercase letters, numbers and single hyphens only.",
  );

const baseShape = {
  name: z.string().trim().min(1, "Enter a name.").max(120, "Name is too long."),
  slug: slugSchema,
  description: z.string().trim().max(500).optional().or(z.literal("")),
  // Already converted to integer pesewa by the action.
  price_ghs: z
    .number({ message: "Enter a price." })
    .int("Price must be a whole number of pesewa.")
    .min(0, "Price cannot be negative."),
  sort_order: z
    .number({ message: "Enter a sort order." })
    .int("Sort order must be a whole number.")
    .min(0, "Sort order cannot be negative."),
  is_active: z.boolean(),
};

export const lensTypeSchema = z.object({
  ...baseShape,
  badge: z.string().trim().max(40).optional().or(z.literal("")),
});

// Mirrors the lens_addons_group_check constraint (migration 20260617000002).
export const LENS_ADDON_GROUPS = ["coating", "sun", "thickness"] as const;
export type LensAddonGroup = (typeof LENS_ADDON_GROUPS)[number];

export const lensAddonSchema = z.object({
  ...baseShape,
  included: z.boolean(),
  group: z.enum(LENS_ADDON_GROUPS),
  single_select: z.boolean(),
});

export type LensTypeInput = z.infer<typeof lensTypeSchema>;
export type LensAddonInput = z.infer<typeof lensAddonSchema>;
