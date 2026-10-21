"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { parsePrice } from "../lib/format";
import {
  addServerCartItem,
  CartError,
  clearServerCart,
  getServerCart,
  removeServerCartItem,
  updateServerCartItem,
} from "../lib/api/cart";
import {
  getGuestCartServerSnapshot,
  getGuestCartSnapshot,
  readCartLinks,
  rememberCartLink,
  subscribeGuestCart,
  writeGuestCart,
} from "../lib/cartStorage";
import CartToast from "../components/cart/CartToast";
import ErrorToast from "../components/layout/ErrorToast";
import type { AddToCartInput, CartItem, ServerCartItem } from "../types/cart";

// Типы остались доступны отсюда — компоненты импортируют их как раньше
export type { AddToCartInput, CartItem } from "../types/cart";

type CartContextValue = {
  items: CartItem[];
  /** Корзина загружена (гость — после чтения браузера, вошедший — после ответа бэка) */
  isReady: boolean;
  /** true — корзина на бэке (пользователь вошёл) */
  isServerCart: boolean;
  totalCount: number;
  totalPrice: number;
  totalOldPrice: number;
  isInCart: (id: string) => boolean;
  addItem: (product: AddToCartInput, options?: { silent?: boolean }) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => Promise<void>;
};

export const MAX_QUANTITY = 99;
const TOAST_DURATION = 3500;
const FALLBACK_ERROR = "Не вдалося оновити кошик. Спробуйте ще раз.";
const NO_VARIANT_ERROR = "Цей товар зараз не можна додати до кошика.";
const MERGE_ERROR = "Деякі товари з кошика не вдалося зберегти в акаунті.";

// Корзина вошедшего хранится вместе с id владельца — после выхода/смены
// пользователя старая просто не используется (без setState в эффекте)
type ServerState = { userId: string; items: ServerCartItem[] };

const CartContext = createContext<CartContextValue | undefined>(undefined);

const subscribeNothing = () => () => {};

function clampQuantity(quantity: number): number {
  return Math.max(1, Math.min(MAX_QUANTITY, Math.round(quantity) || 1));
}

function errorMessage(error: unknown): string {
  return error instanceof CartError ? error.message : FALLBACK_ERROR;
}

/** Позиция с бэка -> позиция UI (slug берём из запомненных ссылок). */
function toCartItem(item: ServerCartItem, links: Record<string, string>): CartItem {
  const slug = links[item.variantId];
  return {
    id: slug ?? `variant:${item.variantId}`,
    slug,
    variantId: item.variantId,
    lineId: item.lineId,
    title: item.title,
    image: item.image,
    price: item.price,
    oldPrice: item.oldPrice,
    quantity: item.quantity,
    available: item.available,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const guestItems = useSyncExternalStore(
    subscribeGuestCart,
    getGuestCartSnapshot,
    getGuestCartServerSnapshot
  );
  // false до гидрации: на сервере браузерной корзины нет
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);

  const [server, setServer] = useState<ServerState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ item: CartItem; key: number } | null>(null);
  const toastCounterRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Запросы к корзине на бэке — строго по очереди
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());

  const enqueue = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const next = queueRef.current.then(task, task);
    queueRef.current = next.catch(() => undefined);
    return next;
  }, []);

  // После входа: переносим корзину гостя на бэк и загружаем корзину пользователя
  useEffect(() => {
    if (!userId) return;
    let active = true;

    enqueue(async () => {
      const guest = getGuestCartSnapshot();
      const left: CartItem[] = [];
      let items: ServerCartItem[] | null = null;

      for (const item of guest) {
        // старые позиции без варианта перенести нельзя
        if (!item.variantId) continue;
        try {
          items = await addServerCartItem(item.variantId, item.quantity);
        } catch {
          left.push(item);
        }
      }
      if (guest.length > 0) writeGuestCart(left);

      return { items: items ?? (await getServerCart()), mergeFailed: left.length > 0 };
    })
      .then(({ items, mergeFailed }) => {
        if (!active) return;
        setServer({ userId, items });
        if (mergeFailed) setError(MERGE_ERROR);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setServer({ userId, items: [] });
        setError(errorMessage(err));
      });

    return () => {
      active = false;
    };
  }, [userId, enqueue]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const isServerCart = userId !== null;
  const serverReady = isServerCart && server?.userId === userId;
  const isReady = hydrated && !authLoading && (!isServerCart || serverReady);

  const items = useMemo<CartItem[]>(() => {
    if (!isServerCart) return guestItems;
    if (!serverReady || !server) return [];
    const links = readCartLinks();
    return server.items.map((item) => toCartItem(item, links));
  }, [isServerCart, serverReady, server, guestItems]);

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

  /** Выполнить действие с корзиной на бэке и взять корзину из ответа. */
  const runServer = useCallback(
    (ownerId: string, task: () => Promise<ServerCartItem[]>, onSuccess?: () => void) => {
      setError(null);
      enqueue(task)
        .then((next) => {
          setServer((prev) => (prev && prev.userId === ownerId ? { userId: ownerId, items: next } : prev));
          onSuccess?.();
        })
        .catch((err: unknown) => setError(errorMessage(err)));
    },
    [enqueue]
  );

  const addItem = useCallback(
    (product: AddToCartInput, options?: { silent?: boolean }) => {
      if (!product.variantId) {
        setError(NO_VARIANT_ERROR);
        return;
      }
      const variantId = product.variantId;
      rememberCartLink(variantId, product.id);

      const added: CartItem = {
        id: product.id,
        slug: product.id,
        variantId,
        title: product.title,
        image: product.image,
        price: parsePrice(product.price),
        oldPrice: product.oldPrice ? parsePrice(product.oldPrice) : null,
        quantity: 1,
      };
      const notify = () => {
        if (!options?.silent) showToast(added);
      };

      if (userId) {
        runServer(userId, () => addServerCartItem(variantId, 1), notify);
        return;
      }

      const current = getGuestCartSnapshot();
      const existing = current.find((item) => item.id === product.id);
      writeGuestCart(
        existing
          ? current.map((item) =>
              item.id === product.id
                ? { ...item, variantId, quantity: Math.min(item.quantity + 1, MAX_QUANTITY) }
                : item
            )
          : [...current, added]
      );
      notify();
    },
    [userId, runServer, showToast]
  );

  const removeItem = useCallback(
    (id: string) => {
      if (userId) {
        const lineId = items.find((item) => item.id === id)?.lineId;
        if (lineId) runServer(userId, () => removeServerCartItem(lineId));
        return;
      }
      writeGuestCart(getGuestCartSnapshot().filter((item) => item.id !== id));
    },
    [userId, items, runServer]
  );

  const setQuantity = useCallback(
    (id: string, quantity: number) => {
      const safe = clampQuantity(quantity);
      if (userId) {
        const lineId = items.find((item) => item.id === id)?.lineId;
        if (lineId) runServer(userId, () => updateServerCartItem(lineId, safe));
        return;
      }
      writeGuestCart(
        getGuestCartSnapshot().map((item) => (item.id === id ? { ...item, quantity: safe } : item))
      );
    },
    [userId, items, runServer]
  );

  const clearCart = useCallback(async () => {
    if (!userId) {
      writeGuestCart([]);
      return;
    }
    const ownerId = userId;
    setError(null);
    try {
      await enqueue(() => clearServerCart());
      setServer((prev) => (prev && prev.userId === ownerId ? { userId: ownerId, items: [] } : prev));
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [userId, enqueue]);

  const clearError = useCallback(() => setError(null), []);

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
      isServerCart,
      totalCount,
      totalPrice,
      totalOldPrice,
      isInCart: (id: string) => items.some((item) => item.id === id),
      addItem,
      removeItem,
      setQuantity,
      clearCart,
    };
  }, [items, isReady, isServerCart, addItem, removeItem, setQuantity, clearCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartToast key={toast?.key} item={toast?.item ?? null} onClose={hideToast} />
      <ErrorToast message={error} onClose={clearError} />
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