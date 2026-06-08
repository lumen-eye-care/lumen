import { z } from "zod";

/**
 * Frame catalogue validation (US-P1-07 admin). Single source of truth,
 * re-validated server-side inside every admin frame action — the client form
 * reuses these for UX only, never as the security boundary.
 *
 * Money note: the admin form collects price in GHS for usability; the action
 * converts to integer pesewa (1 GHS = 100 pesewa) before this schema sees it.
 */

export const FRAME_SHAPES = [
  "round",
  "square",
  "cateye",
  "aviator",
  "oval",
  "hex",
] as const;

export const FRAME_GENDERS = ["men", "women", "unisex"] as const;

export const FRAME_BADGES = ["BESTSELLER", "NEW", "LIMITED"] as const;

export const FRAME_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

// Matches the 5 MB ceiling on the `frames` Storage bucket.
export const FRAME_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

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

const colorSchema = z.object({
  name: z.string().trim().min(1, "Colour needs a name.").max(40),
  hex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour, e.g. #1E3148."),
});

export const frameSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(120, "Name is too long."),
  slug: slugSchema,
  // Already converted to integer pesewa by the action.
  price_ghs: z
    .number({ message: "Enter a price." })
    .int("Price must be a whole number of pesewa.")
    .positive("Price must be greater than zero."),
  stock: z
    .number({ message: "Enter a stock count." })
    .int("Stock must be a whole number.")
    .min(0, "Stock cannot be negative."),
  category_id: z.string().uuid("Choose a category.").nullable(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  shape: z.enum(FRAME_SHAPES).nullable(),
  gender: z.enum(FRAME_GENDERS).nullable(),
  material: z.string().trim().max(80).optional().or(z.literal("")),
  badge: z.enum(FRAME_BADGES).nullable(),
  colors: z.array(colorSchema).max(12, "Too many colours."),
  photo_urls: z.array(z.string().url()).max(12, "Too many photos."),
});

export type FrameInput = z.infer<typeof frameSchema>;

export const markShippedSchema = z.object({
  orderId: z.string().uuid("Invalid order id."),
});
