/**
 * Pure cart logic for the storefront bag (US-P0-03, extended for US-P2-02 lenses).
 *
 * A line can carry a lens build (type + add-ons + a prescription reference). The
 * cart lives entirely client-side in localStorage; the only mildly-sensitive thing
 * it holds is a prescriptionId (an opaque uuid, no Rx values) when the customer
 * reuses/creates a prescription — never the prescription contents themselves.
 *
 * NOTE (checkout): every price here — frame AND lens — is a client-side snapshot
 * for display only. At checkout the server MUST re-derive each price from the DB by
 * frameId + lens slugs — never trust unitPricePesewa / lensUnitPricePesewa from the
 * browser (see src/server/checkout.ts repriceCart).
 *
 * Money is integer pesewa throughout (1 GHS = 100 pesewa), matching
 * ShopFrame.price_ghs; format with formatGhs() at the display edge only.
 */

import type { ShopFrame } from "@/server/frames";
import type { RxMethod, LensSelectionInput } from "@/lib/checkout-schemas";

/**
 * Versioned localStorage key — bumped v1→v2 for the lens fields. Old v1 bags live
 * under the previous key and are simply never read (dropped), which is the desired
 * behaviour: a pre-lens bag shouldn't silently become a frame-only lens build.
 */
export const CART_STORAGE_KEY = "lumen.cart.v2";

/**
 * localStorage key recording which auth user "owns" the persisted bag. The bag
 * lives per-browser, so this lets us clear it when the user changes (sign-out or
 * a different account signing in) instead of leaking one person's bag to the next.
 */
export const CART_OWNER_KEY = "lumen.cart.owner";

/**
 * The lens build attached to a line. A frame-only line has lensTypeSlug = null and
 * lensUnitPricePesewa = 0. lensUnitPricePesewa is a display snapshot (re-priced at
 * checkout). prescriptionId is an opaque reference, set only via the Rx step.
 */
export type CartLens = {
  lensTypeSlug: string | null;
  lensTypeName: string | null;
  lensUnitPricePesewa: number;
  addonSlugs: string[];
  addonNames: string[];
  rxMethod: RxMethod | null;
  prescriptionId: string | null;
};

export const FRAME_ONLY_LENS: CartLens = {
  lensTypeSlug: null,
  lensTypeName: null,
  lensUnitPricePesewa: 0,
  addonSlugs: [],
  addonNames: [],
  rxMethod: null,
  prescriptionId: null,
};

/**
 * A single bag line. Keyed by frame + colour + lens build, so the same frame in the
 * same colour with two different lens builds are two distinct lines.
 */
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
  lens: CartLens;
};

export type CartState = {
  items: CartItem[];
};

export const EMPTY_CART: CartState = { items: [] };

/**
 * Deterministic fingerprint of a lens build, so two identical builds merge and any
 * difference (type, add-ons, Rx method, prescription) splits into its own line.
 * Add-ons are sorted so order doesn't matter.
 */
export function lensConfigKey(lens: CartLens): string {
  if (!lens.lensTypeSlug) return "frame-only";
  const addons = [...lens.addonSlugs].sort().join(",");
  return [lens.lensTypeSlug, addons, lens.rxMethod ?? "", lens.prescriptionId ?? ""].join("|");
}

/** Stable line identity: same frame + colour + lens build merges into one. */
export function lineKey(frameId: string, colorName: string, lensKey: string): string {
  return `${frameId}::${colorName}::${lensKey}`;
}

export function cartItemKey(item: CartItem): string {
  return lineKey(item.frameId, item.colorName, lensConfigKey(item.lens));
}

/**
 * Build a frame-only CartItem from a frame + a chosen colour index.
 * Returns null when the colour index is out of range.
 */
export function frameToCartItem(
  frame: ShopFrame,
  colorIndex: number,
  qty = 1,
): CartItem | null {
  return buildLensCartItem(frame, colorIndex, FRAME_ONLY_LENS, qty);
}

/**
 * Build a CartItem from a frame + colour index + a chosen lens build. The lens
 * prices are display snapshots; checkout re-prices from the DB.
 * Returns null when the colour index is out of range.
 */
export function buildLensCartItem(
  frame: ShopFrame,
  colorIndex: number,
  lens: CartLens,
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
    lens,
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

// ─── Auth scoping ───────────────────────────────────────────────────────────────

/**
 * Decide what to do with the persisted bag when the authenticated user changes.
 * Pure so it can be unit-tested; the side effects (clearing the cart, writing the
 * owner marker) live in the CartAuthSync client component.
 *
 *  - signed out (nextUserId null)            → clear, drop the owner
 *  - anonymous bag, then sign-in (no owner)  → keep (claim it for that user)
 *  - same user as the owner                  → keep
 *  - a different user signs in               → clear, hand the owner over
 *
 * The anonymous→sign-in case is deliberately preserved so a shopper who builds a
 * bag while logged out keeps it through the sign-in required at checkout.
 */
export function decideCartOnAuth(
  prevOwner: string | null,
  nextUserId: string | null,
): { clear: boolean; nextOwner: string | null } {
  if (!nextUserId) return { clear: true, nextOwner: null };
  if (!prevOwner || prevOwner === nextUserId) {
    return { clear: false, nextOwner: nextUserId };
  }
  return { clear: true, nextOwner: nextUserId };
}

// ─── Selectors ────────────────────────────────────────────────────────────────

/** Total number of units across all lines (for the header badge). */
export function selectCount(state: CartState): number {
  return state.items.reduce((sum, i) => sum + i.qty, 0);
}

/** Per-unit price of a line: frame + lens surcharge. */
export function lineUnitPricePesewa(item: CartItem): number {
  return item.unitPricePesewa + item.lens.lensUnitPricePesewa;
}

/**
 * Map a line's lens build to the checkout wire shape (slugs only, no prices).
 * Returns undefined for a frame-only line, so the payload omits `lens` entirely.
 */
export function cartLensToInput(lens: CartLens): LensSelectionInput | undefined {
  if (!lens.lensTypeSlug) return undefined;
  return {
    lensTypeSlug: lens.lensTypeSlug,
    addonSlugs: lens.addonSlugs,
    rxMethod: lens.rxMethod ?? undefined,
    prescriptionId: lens.prescriptionId ?? undefined,
  };
}

/** Subtotal in pesewa — frame + lens across every line. */
export function selectSubtotalPesewa(state: CartState): number {
  return state.items.reduce((sum, i) => sum + lineUnitPricePesewa(i) * i.qty, 0);
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
    lens: sanitizeLens(e.lens),
  };
}

/** Narrow an unknown persisted lens payload; anything off → frame-only. */
function sanitizeLens(entry: unknown): CartLens {
  if (entry === null || typeof entry !== "object") return FRAME_ONLY_LENS;
  const e = entry as Record<string, unknown>;
  if (typeof e.lensTypeSlug !== "string") return FRAME_ONLY_LENS;
  const addonSlugs = Array.isArray(e.addonSlugs)
    ? e.addonSlugs.filter((s): s is string => typeof s === "string")
    : [];
  const addonNames = Array.isArray(e.addonNames)
    ? e.addonNames.filter((s): s is string => typeof s === "string")
    : [];
  return {
    lensTypeSlug: e.lensTypeSlug,
    lensTypeName: typeof e.lensTypeName === "string" ? e.lensTypeName : null,
    lensUnitPricePesewa: typeof e.lensUnitPricePesewa === "number" ? e.lensUnitPricePesewa : 0,
    addonSlugs,
    addonNames,
    rxMethod: isRxMethod(e.rxMethod) ? e.rxMethod : null,
    prescriptionId: typeof e.prescriptionId === "string" ? e.prescriptionId : null,
  };
}

const RX_METHOD_VALUES: readonly RxMethod[] = ["later", "onfile", "upload", "manual"];
function isRxMethod(v: unknown): v is RxMethod {
  return typeof v === "string" && (RX_METHOD_VALUES as readonly string[]).includes(v);
}
