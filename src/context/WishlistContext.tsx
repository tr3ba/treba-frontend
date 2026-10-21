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
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import {
  addToWishlist,
  getWishlist,
  getWishlistKey,
  removeFromWishlist,
  WishlistError,
} from "../lib/api/wishlist";
import ErrorToast from "../components/layout/ErrorToast";
import type { Product } from "../types/product";
import type { WishlistItem } from "../types/wishlist";

/** Минимум данных о товаре, нужный избранному. */
export type WishlistProduct = Pick<Product, "id" | "backendId">;

type WishlistContextValue = {
  /** Товары в избранном, новые сверху */
  items: WishlistItem[];
  count: number;
  /** Список текущего пользователя загружен (для гостя всегда false) */
  isReady: boolean;
  isInWishlist: (product: WishlistProduct) => boolean;
  /** Добавить/убрать. Гостя отправляет на вход. */
  toggle: (product: WishlistProduct) => Promise<void>;
  /** Убрать по ключу (на странице избранного) */
  remove: (productKey: string) => Promise<void>;
  /** Текст последней ошибки для UI */
  error: string | null;
  clearError: () => void;
};

// Список хранится вместе с id владельца: после выхода или смены пользователя
// старый список просто не используется — без setState внутри эффекта.
type WishlistState = { userId: string; items: WishlistItem[] };

const FALLBACK_ERROR = "Не вдалося оновити список бажань. Спробуйте ще раз.";

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

function byNewest(a: WishlistItem, b: WishlistItem): number {
  return b.addedAt.localeCompare(a.addedAt);
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const userId = user?.id ?? null;

  const [state, setState] = useState<WishlistState | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Товары, по которым запрос ещё идёт — защита от двойного клика
  const pendingRef = useRef<Set<string>>(new Set());

  // Загрузка списка после входа / смены пользователя
  useEffect(() => {
    if (!userId) return;
    let active = true;

    getWishlist()
      .then((items) => {
        if (active) setState({ userId, items: [...items].sort(byNewest) });
      })
      .catch(() => {
        // не загрузили — показываем пустой список, повторим при следующем входе
        if (active) setState({ userId, items: [] });
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const isReady = userId !== null && state?.userId === userId;
  const items = useMemo(() => (isReady && state ? state.items : []), [isReady, state]);

  /** Меняет список, только если он всё ещё принадлежит этому пользователю. */
  const updateItems = useCallback(
    (ownerId: string, change: (list: WishlistItem[]) => WishlistItem[]) => {
      setState((prev) =>
        prev && prev.userId === ownerId ? { userId: ownerId, items: change(prev.items) } : prev
      );
    },
    []
  );

  const changeItem = useCallback(
    async (productKey: string, shouldAdd: boolean) => {
      if (!userId || !isReady || pendingRef.current.has(productKey)) return;

      const previous = items.find((item) => item.productKey === productKey);
      if (shouldAdd === Boolean(previous)) return; // уже в нужном состоянии

      pendingRef.current.add(productKey);
      setError(null);

      // Сразу меняем UI, при ошибке — откатываем
      if (shouldAdd) {
        const added: WishlistItem = { productKey, addedAt: new Date().toISOString() };
        updateItems(userId, (list) => [added, ...list]);
      } else {
        updateItems(userId, (list) => list.filter((item) => item.productKey !== productKey));
      }

      try {
        if (shouldAdd) await addToWishlist(productKey);
        else await removeFromWishlist(productKey);
      } catch (err) {
        if (shouldAdd) {
          updateItems(userId, (list) => list.filter((item) => item.productKey !== productKey));
        } else if (previous) {
          updateItems(userId, (list) => [...list, previous].sort(byNewest));
        }
        setError(err instanceof WishlistError ? err.message : FALLBACK_ERROR);
      } finally {
        pendingRef.current.delete(productKey);
      }
    },
    [userId, isReady, items, updateItems]
  );

  const toggle = useCallback(
    async (product: WishlistProduct) => {
      if (!userId) {
        // Гость — на вход (откроется модалка), потом вернёмся на эту же страницу
        const next = window.location.pathname + window.location.search;
        router.push("/login?next=" + encodeURIComponent(next));
        return;
      }
      const key = getWishlistKey(product);
      const isIn = items.some((item) => item.productKey === key);
      await changeItem(key, !isIn);
    },
    [userId, items, changeItem, router]
  );

  const remove = useCallback((productKey: string) => changeItem(productKey, false), [changeItem]);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      count: items.length,
      isReady,
      isInWishlist: (product: WishlistProduct) => {
        const key = getWishlistKey(product);
        return items.some((item) => item.productKey === key);
      },
      toggle,
      remove,
      error,
      clearError,
    }),
    [items, isReady, toggle, remove, error, clearError]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
      <ErrorToast message={error} onClose={clearError} />
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist має використовуватися всередині WishlistProvider");
  }
  return ctx;
}