"use client";

/**
 * Client-only bag store (US-P0-03). React Context + useReducer — SSR-safe
 * (created per client render, no module-level global) and zero-dependency,
 * keeping the JS bundle within budget.
 *
 * Persisted to localStorage under CART_STORAGE_KEY. Hydration runs in an effect
 * with a `hydrated` flag (kept inside the reducer so it lands in the same
 * dispatch) so the server render and first client paint both match an empty
 * cart, then the persisted cart swaps in without a hydration mismatch.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  EMPTY_CART,
  CART_STORAGE_KEY,
  addItem,
  changeQty,
  removeItem,
  parseStoredCart,
  selectCount,
  selectSubtotalPesewa,
  type CartItem,
  type CartState,
} from "@/lib/cart";

type StoreState = { cart: CartState; hydrated: boolean };

type CartAction =
  | { type: "hydrate"; cart: CartState }
  | { type: "add"; item: CartItem }
  | { type: "changeQty"; key: string; delta: number }
  | { type: "remove"; key: string }
  | { type: "clear" };

const INITIAL: StoreState = { cart: EMPTY_CART, hydrated: false };

function reducer(state: StoreState, action: CartAction): StoreState {
  switch (action.type) {
    case "hydrate":
      return { cart: action.cart, hydrated: true };
    case "add":
      return { ...state, cart: addItem(state.cart, action.item) };
    case "changeQty":
      return { ...state, cart: changeQty(state.cart, action.key, action.delta) };
    case "remove":
      return { ...state, cart: removeItem(state.cart, action.key) };
    case "clear":
      return { ...state, cart: EMPTY_CART };
    default:
      return state;
  }
}

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotalPesewa: number;
  /** True once localStorage has been read — gate count-dependent UI on this. */
  hydrated: boolean;
  add: (item: CartItem) => void;
  changeQty: (key: string, delta: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  // Drawer
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [isOpen, setIsOpen] = useState(false);

  // Hydrate once from localStorage after mount (single dispatch, no cascade).
  useEffect(() => {
    dispatch({
      type: "hydrate",
      cart: parseStoredCart(localStorage.getItem(CART_STORAGE_KEY)),
    });
  }, []);

  // Persist on change — but only after hydration, so the initial empty state
  // never clobbers a stored cart.
  const persistRef = useRef(false);
  useEffect(() => {
    if (!state.hydrated) return;
    // Skip the very first post-hydration run (state already equals storage).
    if (!persistRef.current) {
      persistRef.current = true;
      return;
    }
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
    } catch {
      // Quota/private-mode failures are non-fatal — the in-memory cart still works.
    }
  }, [state]);

  const add = useCallback((item: CartItem) => dispatch({ type: "add", item }), []);
  const changeQtyCb = useCallback(
    (key: string, delta: number) => dispatch({ type: "changeQty", key, delta }),
    [],
  );
  const remove = useCallback((key: string) => dispatch({ type: "remove", key }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.cart.items,
      count: selectCount(state.cart),
      subtotalPesewa: selectSubtotalPesewa(state.cart),
      hydrated: state.hydrated,
      add,
      changeQty: changeQtyCb,
      remove,
      clear,
      isOpen,
      open,
      close,
    }),
    [state, isOpen, add, changeQtyCb, remove, clear, open, close],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
