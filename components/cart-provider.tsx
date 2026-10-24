"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { computeTotals } from "@/lib/pricing";
import type { CartLine, CartTotals, Coupon, SiteSettings } from "@/lib/types";

const STORAGE_KEY = "leaf-and-pot-cart-v1";

interface StoredCart {
  lines: CartLine[];
  coupon: Coupon | null;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  totals: CartTotals;
  coupon: Coupon | null;
  couponError: string | null;
  zoneCharge: number | null;
  hydrated: boolean;
  loggedIn: boolean;
  addLine: (line: CartLine, qty?: number) => void;
  removeLine: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  clear: () => void;
  applyCoupon: (coupon: Coupon | null) => void;
  setZoneCharge: (charge: number | null) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}

export function CartProvider({
  children,
  settings,
  loggedIn,
}: {
  children: React.ReactNode;
  settings: SiteSettings;
  loggedIn: boolean;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [zoneCharge, setZoneCharge] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredCart;
        if (Array.isArray(parsed.lines)) {
          setLines(
            parsed.lines.filter(
              (line) =>
                line &&
                typeof line.variantId === "string" &&
                typeof line.price === "number" &&
                typeof line.qty === "number",
            ),
          );
        }
        if (parsed.coupon) setCoupon(parsed.coupon);
      }
    } catch {
      /* corrupted storage is safely ignored */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines, coupon }));
    } catch {
      /* storage may be unavailable (private mode) */
    }
  }, [lines, coupon, hydrated]);

  // Persist signed-in carts to the server so they survive a device change.
  // The server recomputes prices at checkout; this payload is only variant + qty.
  useEffect(() => {
    if (!hydrated || !loggedIn) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch("/api/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: lines.map((line) => ({ variantId: line.variantId, qty: line.qty })) }),
        signal: controller.signal,
      }).catch(() => undefined);
    }, 900);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [lines, hydrated, loggedIn]);

  const addLine = useCallback((line: CartLine, qty = 1) => {
    setLines((current) => {
      const existing = current.find((item) => item.variantId === line.variantId);
      if (existing) {
        return current.map((item) =>
          item.variantId === line.variantId
            ? { ...item, qty: Math.min(line.stock || 20, item.qty + qty), stock: line.stock }
            : item,
        );
      }
      return [...current, { ...line, qty: Math.max(1, Math.min(qty, line.stock || 20)) }];
    });
  }, []);

  const removeLine = useCallback((variantId: string) => {
    setLines((current) => current.filter((line) => line.variantId !== variantId));
  }, []);

  const setQty = useCallback((variantId: string, qty: number) => {
    setLines((current) =>
      current.map((line) =>
        line.variantId === variantId
          ? { ...line, qty: Math.max(1, Math.min(qty, line.stock || 20)) }
          : line,
      ),
    );
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setCoupon(null);
    setZoneCharge(null);
  }, []);

  const totals = useMemo(
    () =>
      computeTotals({
        lines,
        settings,
        coupon,
        zoneCharge,
      }),
    [lines, settings, coupon, zoneCharge],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((sum, line) => sum + line.qty, 0),
      totals,
      coupon,
      couponError: coupon ? totals.couponError : null,
      zoneCharge,
      hydrated,
      loggedIn,
      addLine,
      removeLine,
      setQty,
      clear,
      applyCoupon: (next) => setCoupon(next),
      setZoneCharge,
    }),
    [lines, totals, coupon, zoneCharge, hydrated, loggedIn, addLine, removeLine, setQty, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
