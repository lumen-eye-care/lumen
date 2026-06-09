import { describe, it, expect } from "vitest";
import {
  EMPTY_CART,
  lineKey,
  frameToCartItem,
  addItem,
  changeQty,
  removeItem,
  clearCart,
  selectCount,
  selectSubtotalPesewa,
  parseStoredCart,
  CART_STORAGE_KEY,
  type CartItem,
  type CartState,
} from "@/lib/cart";
import type { ShopFrame } from "@/server/frames";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const frame: ShopFrame = {
  id: "f1",
  name: "Accra",
  slug: "accra",
  price_ghs: 58000, // 580 GHS in pesewa
  stock: 3,
  badge: "BESTSELLER",
  shape: "round",
  gender: "men",
  material: "Italian Acetate",
  description: null,
  colors: [
    { name: "Midnight", hex: "#1E3148" },
    { name: "Tortoise", hex: "#8B4513" },
  ],
  photo_urls: ["https://cdn.example/accra.jpg"],
  category: { id: "c1", slug: "optical", name: "Optical", hero_title: null, hero_subtitle: null },
};

const midnight: CartItem = frameToCartItem(frame, 0)!;
const tortoise: CartItem = frameToCartItem(frame, 1)!;

// ─── frameToCartItem ──────────────────────────────────────────────────────────

describe("frameToCartItem", () => {
  it("maps a frame + colour index to a line item (pesewa preserved)", () => {
    expect(midnight).toMatchObject({
      frameId: "f1",
      slug: "accra",
      name: "Accra",
      colorName: "Midnight",
      colorHex: "#1E3148",
      shape: "round",
      photoUrl: "https://cdn.example/accra.jpg",
      unitPricePesewa: 58000,
      stock: 3,
      qty: 1,
    });
  });

  it("returns null for an out-of-range colour index", () => {
    expect(frameToCartItem(frame, 9)).toBeNull();
  });

  it("falls back to null photoUrl when the frame has no photos", () => {
    const noPhoto = frameToCartItem({ ...frame, photo_urls: [] }, 0);
    expect(noPhoto?.photoUrl).toBeNull();
  });
});

// ─── lineKey ──────────────────────────────────────────────────────────────────

describe("lineKey", () => {
  it("is stable per frame+colour and distinct across colours", () => {
    expect(lineKey("f1", "Midnight")).toBe("f1::Midnight");
    expect(lineKey("f1", "Midnight")).not.toBe(lineKey("f1", "Tortoise"));
  });
});

// ─── addItem ──────────────────────────────────────────────────────────────────

describe("addItem", () => {
  it("appends a new line", () => {
    const next = addItem(EMPTY_CART, midnight);
    expect(next.items).toHaveLength(1);
    expect(next.items[0].qty).toBe(1);
  });

  it("merges a same frame+colour line by summing qty", () => {
    let state = addItem(EMPTY_CART, midnight);
    state = addItem(state, { ...midnight, qty: 1 });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].qty).toBe(2);
  });

  it("keeps different colours as separate lines", () => {
    let state = addItem(EMPTY_CART, midnight);
    state = addItem(state, tortoise);
    expect(state.items).toHaveLength(2);
  });

  it("caps merged qty at the stock snapshot", () => {
    let state = addItem(EMPTY_CART, { ...midnight, qty: 2 });
    state = addItem(state, { ...midnight, qty: 5 }); // 2 + 5, stock = 3
    expect(state.items[0].qty).toBe(3);
  });

  it("does not mutate the input state", () => {
    const before: CartState = { items: [] };
    addItem(before, midnight);
    expect(before.items).toHaveLength(0);
  });
});

// ─── changeQty ────────────────────────────────────────────────────────────────

describe("changeQty", () => {
  const key = lineKey("f1", "Midnight");

  it("increments up to stock and no further", () => {
    let state = addItem(EMPTY_CART, midnight); // qty 1
    state = changeQty(state, key, 1); // 2
    state = changeQty(state, key, 1); // 3 (= stock)
    state = changeQty(state, key, 1); // capped at 3
    expect(state.items[0].qty).toBe(3);
  });

  it("removes the line when qty drops to zero", () => {
    let state = addItem(EMPTY_CART, midnight);
    state = changeQty(state, key, -1);
    expect(state.items).toHaveLength(0);
  });

  it("is a no-op for an unknown key", () => {
    const state = addItem(EMPTY_CART, midnight);
    expect(changeQty(state, "nope::x", 1)).toBe(state);
  });
});

// ─── removeItem / clearCart ───────────────────────────────────────────────────

describe("removeItem / clearCart", () => {
  it("removes a specific line", () => {
    let state = addItem(EMPTY_CART, midnight);
    state = addItem(state, tortoise);
    state = removeItem(state, lineKey("f1", "Midnight"));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].colorName).toBe("Tortoise");
  });

  it("clearCart returns an empty cart", () => {
    expect(clearCart()).toEqual(EMPTY_CART);
  });
});

// ─── selectors ────────────────────────────────────────────────────────────────

describe("selectors", () => {
  it("selectCount sums quantities across lines", () => {
    let state = addItem(EMPTY_CART, { ...midnight, qty: 2 });
    state = addItem(state, tortoise);
    expect(selectCount(state)).toBe(3);
  });

  it("selectSubtotalPesewa sums unit price × qty", () => {
    let state = addItem(EMPTY_CART, { ...midnight, qty: 2 }); // 2 × 58000
    state = addItem(state, tortoise); // 1 × 58000
    expect(selectSubtotalPesewa(state)).toBe(58000 * 3);
  });

  it("empty cart totals are zero", () => {
    expect(selectCount(EMPTY_CART)).toBe(0);
    expect(selectSubtotalPesewa(EMPTY_CART)).toBe(0);
  });
});

// ─── parseStoredCart ──────────────────────────────────────────────────────────

describe("parseStoredCart", () => {
  it("round-trips a valid persisted cart", () => {
    const state = addItem(EMPTY_CART, midnight);
    const restored = parseStoredCart(JSON.stringify(state));
    expect(restored).toEqual(state);
  });

  it("returns an empty cart for null / malformed / corrupt input", () => {
    expect(parseStoredCart(null)).toEqual(EMPTY_CART);
    expect(parseStoredCart("not json")).toEqual(EMPTY_CART);
    expect(parseStoredCart("{}")).toEqual(EMPTY_CART);
    expect(parseStoredCart('{"items": "x"}')).toEqual(EMPTY_CART);
  });

  it("drops malformed line entries but keeps valid ones", () => {
    const payload = JSON.stringify({
      items: [midnight, { frameId: "broken" }, null, 42],
    });
    const restored = parseStoredCart(payload);
    expect(restored.items).toHaveLength(1);
    expect(restored.items[0].frameId).toBe("f1");
  });

  it("re-clamps a tampered qty above stock on load", () => {
    const payload = JSON.stringify({ items: [{ ...midnight, qty: 999 }] });
    expect(parseStoredCart(payload).items[0].qty).toBe(3);
  });

  it("exposes a versioned storage key", () => {
    expect(CART_STORAGE_KEY).toBe("lumen.cart.v1");
  });
});
