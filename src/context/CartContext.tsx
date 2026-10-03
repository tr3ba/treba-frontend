"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { parsePrice } from "../lib/format";
import CartToast from "../components/cart/CartToast";

export type CartItem = {
  id: string;
  title: string;
  image?: string;
  price: number;
  oldPrice: number | null;
  quantity: number;
};

// Те, що передає картка товару при додаванні
export type AddToCartInput = {
  id: string;
  title: string;
  price: string;
  oldPrice?: string | null;
  image?: string;
};

type CartContextValue = {
  items: CartItem[];
  isReady: boolean;
  totalCount: number;
  totalPrice: number;
  totalOldPrice: number;
  isInCart: (id: string) => boolean;
  addItem: (product: AddToCartInput, options?: { silent?: boolean }) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const CART_KEY = "treba_cart";
export const MAX_QUANTITY = 99;
const TOAST_DURATION = 3500;

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [toast, setToast] = useState<{ item: CartItem; key: number } | null>(null);
  const toastCounterRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Завантаження кошика з localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      // пошкоджені дані — починаємо з порожнього кошика
    } finally {
      setIsReady(true);
    }
  }, []);

  // Збереження після кожної зміни
  useEffect(() => {
    if (!isReady) return;
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // localStorage недоступний — працюємо лише в пам'яті
    }
  }, [items, isReady]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = useCallback((item: CartItem) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastCounterRef.current += 1;
    setToast({ item, key: toastCounterRef.current });
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_DURATION);
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  }, []);

  const addItem = useCallback(
    (product: AddToCartInput, options?: { silent?: boolean }) => {
      const newItem: CartItem = {
        id: product.id,
        title: product.title,
        image: product.image,
        price: parsePrice(product.price),
        oldPrice: product.oldPrice ? parsePrice(product.oldPrice) : null,
        quantity: 1,
      };

      setItems((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id
              ? { ...item, quantity: Math.min(item.quantity + 1, MAX_QUANTITY) }
              : item
          );
        }
        return [...prev, newItem];
      });

      if (!options?.silent) showToast(newItem);
    },
    [showToast]
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    const safe = Math.max(1, Math.min(MAX_QUANTITY, Math.round(quantity) || 1));
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: safe } : item)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalOldPrice = items.reduce(
      (sum, item) => sum + (item.oldPrice ?? item.price) * item.quantity,
      0
    );

    return {
      items,
      isReady,
      totalCount,
      totalPrice,
      totalOldPrice,
      isInCart: (id: string) => items.some((item) => item.id === id),
      addItem,
      removeItem,
      setQuantity,
      clearCart,
    };
  }, [items, isReady, addItem, removeItem, setQuantity, clearCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartToast key={toast?.key} item={toast?.item ?? null} onClose={hideToast} />
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart має використовуватися всередині CartProvider");
  }
  return ctx;
}