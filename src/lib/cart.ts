/**
 * Pure cart logic for the storefront bag (US-P0-03).
 *
 * Frame-only for v1: lens type / add-ons / prescription are deferred to
 * US-P2-02 (Lens Builder). The cart lives entirely client-side in localStorage;
 * it carries no PII.
 *
 * NOTE (checkout, later story): prices here are a client-side snapshot for
 * display only. At checkout the server MUST re-derive every line price from the
 * DB by frameId — never trust unitPricePesewa coming back from the browser.
 *
 * Money is integer pesewa throughout (1 GHS = 100 pesewa), matching
 * ShopFrame.price_ghs; format with formatGhs() at the display edge only.
 */

import type { ShopFrame } from "@/server/frames";

/** Versioned localStorage key — bump the suffix if the item shape changes. */
export const CART_STORAGE_KEY = "lumen.cart.v1";

/** A single bag line. Keyed by frame + colour (a colour swap is a new line). */
export type CartItem = {
  frameId: string;
  slug: string;
  name: string;
  colorName: string;
  colorHex: string;
  shape: string | null;
  photoUrl: string | null;
  unitPricePesewa: number;
  /** Stock snapshot at add-time; qty is clamped to this. */
  stock: number;
  qty: number;
};

export type CartState = {
  items: CartItem[];
};

export const EMPTY_CART: CartState = { items: [] };

/** Stable line identity: two adds of the same frame+colour merge into one. */
export function lineKey(frameId: string, colorName: string): string {
  return `${frameId}::${colorName}`;
}

export function cartItemKey(item: CartItem): string {
  return lineKey(item.frameId, item.colorName);
}

/**
 * Build a CartItem from a frame + a chosen colour index.
 * Returns null when the colour index is out of range or the frame is unsellable
 * (no stock) — callers should guard the add button on stock anyway.
 */
export function frameToCartItem(
  frame: ShopFrame,
  colorIndex: number,
  qty = 1,
): CartItem | null {
  const color = frame.colors[colorIndex];
  if (!color) return null;
  return {
    frameId: frame.id,
    slug: frame.slug,
    name: frame.name,
    colorName: color.name,
    colorHex: color.hex,
    shape: frame.shape,
    photoUrl: frame.photo_urls[0] ?? null,
    unitPricePesewa: frame.price_ghs,
    stock: frame.stock,
    qty: Math.max(1, qty),
  };
}

function clampQty(qty: number, stock: number): number {
  // stock <= 0 should never reach the cart, but clamp defensively to 1.
  const max = stock > 0 ? stock : 1;
  if (qty < 1) return 1;
  return qty > max ? max : qty;
}

/**
 * Add an item, merging with an existing same-key line (summing qty, capped at
 * stock). Returns a new state — never mutates the input.
 */
export function addItem(state: CartState, item: CartItem): CartState {
  const key = cartItemKey(item);
  const existing = state.items.find((i) => cartItemKey(i) === key);

  if (!existing) {
    return { items: [...state.items, { ...item, qty: clampQty(item.qty, item.stock) }] };
  }

  return {
    items: state.items.map((i) =>
      cartItemKey(i) === key
        ? { ...i, qty: clampQty(i.qty + item.qty, i.stock) }
        : i,
    ),
  };
}

/**
 * Nudge a line's quantity by a (signed) delta. Dropping to 0 or below removes
 * the line. Increases are capped at the line's stock snapshot.
 */
export function changeQty(
  state: CartState,
  key: string,
  delta: number,
): CartState {
  const target = state.items.find((i) => cartItemKey(i) === key);
  if (!target) return state;

  const nextQty = target.qty + delta;
  if (nextQty <= 0) return removeItem(state, key);

  return {
    items: state.items.map((i) =>
      cartItemKey(i) === key ? { ...i, qty: clampQty(nextQty, i.stock) } : i,
    ),
  };
}

export function removeItem(state: CartState, key: string): CartState {
  return { items: state.items.filter((i) => cartItemKey(i) !== key) };
}

export function clearCart(): CartState {
  return EMPTY_CART;
}

// ─── Selectors ────────────────────────────────────────────────────────────────

/** Total number of units across all lines (for the header badge). */
export function selectCount(state: CartState): number {
  return state.items.reduce((sum, i) => sum + i.qty, 0);
}

/** Subtotal in pesewa. */
export function selectSubtotalPesewa(state: CartState): number {
  return state.items.reduce((sum, i) => sum + i.unitPricePesewa * i.qty, 0);
}

// ─── Persistence helpers (used by the provider; pure + guarded) ───────────────

/**
 * Re-hydrate cart state from an unknown localStorage payload, dropping anything
 * malformed. Defensive: a corrupt/old payload yields an empty cart, never throws.
 */
export function parseStoredCart(raw: string | null): CartState {
  if (!raw) return EMPTY_CART;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      !("items" in parsed) ||
      !Array.isArray((parsed as { items: unknown }).items)
    ) {
      return EMPTY_CART;
    }
    const items = (parsed as { items: unknown[] }).items.flatMap((entry) => {
      const item = sanitizeItem(entry);
      return item ? [item] : [];
    });
    return { items };
  } catch {
    return EMPTY_CART;
  }
}

function sanitizeItem(entry: unknown): CartItem | null {
  if (entry === null || typeof entry !== "object") return null;
  const e = entry as Record<string, unknown>;
  if (
    typeof e.frameId !== "string" ||
    typeof e.slug !== "string" ||
    typeof e.name !== "string" ||
    typeof e.colorName !== "string" ||
    typeof e.colorHex !== "string" ||
    typeof e.unitPricePesewa !== "number" ||
    typeof e.stock !== "number" ||
    typeof e.qty !== "number"
  ) {
    return null;
  }
  return {
    frameId: e.frameId,
    slug: e.slug,
    name: e.name,
    colorName: e.colorName,
    colorHex: e.colorHex,
    shape: typeof e.shape === "string" ? e.shape : null,
    photoUrl: typeof e.photoUrl === "string" ? e.photoUrl : null,
    unitPricePesewa: e.unitPricePesewa,
    stock: e.stock,
    qty: clampQty(e.qty, e.stock),
  };
}
