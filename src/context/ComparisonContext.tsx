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
  addToComparison,
  ComparisonError,
  deleteComparisonList,
  getComparisonLists,
  removeFromComparison,
} from "../lib/api/comparisons";
import ErrorToast from "../components/layout/ErrorToast";
import type {
  ComparisonList,
  ComparisonProduct,
  ComparisonToggleResult,
} from "../types/comparison";

type ComparisonContextValue = {
  /** Списки порівняння, нові зверху */
  lists: ComparisonList[];
  /** Усього товарів у всіх списках — для бейджа в шапці */
  count: number;
  /** Списки поточного користувача завантажені (для гостя завжди false) */
  isReady: boolean;
  isInComparison: (productKey: string) => boolean;
  getList: (listId: string) => ComparisonList | undefined;
  /** Додати/прибрати товар. Гостя відправляє на вхід. */
  toggle: (product: ComparisonProduct) => Promise<ComparisonToggleResult>;
  /** Прибрати товар (на сторінці порівняння) */
  remove: (productKey: string) => Promise<void>;
  /** Видалити список повністю */
  removeList: (listId: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
};

// Списки зберігаються разом з id власника: після виходу або зміни користувача
// старі списки просто не використовуються — без setState всередині ефекту.
type ComparisonState = { userId: string; lists: ComparisonList[] };

const FALLBACK_ERROR = "Не вдалося оновити порівняння. Спробуйте ще раз.";

const ComparisonContext = createContext<ComparisonContextValue | undefined>(undefined);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const userId = user?.id ?? null;

  const [state, setState] = useState<ComparisonState | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Запит уже йде — захист від подвійного кліку
  const pendingRef = useRef(false);

  // Завантаження списків після входу / зміни користувача
  useEffect(() => {
    if (!userId) return;
    let active = true;

    getComparisonLists(userId)
      .then((lists) => {
        if (active) setState({ userId, lists });
      })
      .catch(() => {
        if (active) setState({ userId, lists: [] });
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const isReady = userId !== null && state?.userId === userId;
  const lists = useMemo(() => (isReady && state ? state.lists : []), [isReady, state]);

  const keys = useMemo(
    () => new Set(lists.flatMap((list) => list.items.map((item) => item.productKey))),
    [lists]
  );

  /** Виконує запит і зберігає результат, якщо користувач не змінився. */
  const run = useCallback(
    async (request: (ownerId: string) => Promise<ComparisonList[]>): Promise<boolean> => {
      if (!userId || !isReady || pendingRef.current) return false;
      pendingRef.current = true;
      setError(null);
      try {
        const next = await request(userId);
        setState((prev) => (prev && prev.userId === userId ? { userId, lists: next } : prev));
        return true;
      } catch (err) {
        setError(err instanceof ComparisonError ? err.message : FALLBACK_ERROR);
        return false;
      } finally {
        pendingRef.current = false;
      }
    },
    [userId, isReady]
  );

  const toggle = useCallback(
    async (product: ComparisonProduct): Promise<ComparisonToggleResult> => {
      if (!userId) {
        // Гість — на вхід (відкриється модалка), потім повернемося на цю ж сторінку
        const next = window.location.pathname + window.location.search;
        router.push("/login?next=" + encodeURIComponent(next));
        return null;
      }
      const isIn = keys.has(product.id);
      const ok = await run((ownerId) =>
        isIn ? removeFromComparison(ownerId, product.id) : addToComparison(ownerId, product)
      );
      if (!ok) return null;
      return isIn ? "removed" : "added";
    },
    [userId, keys, run, router]
  );

  const remove = useCallback(
    async (productKey: string) => {
      await run((ownerId) => removeFromComparison(ownerId, productKey));
    },
    [run]
  );

  const removeList = useCallback(
    async (listId: string) => {
      await run((ownerId) => deleteComparisonList(ownerId, listId));
    },
    [run]
  );

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<ComparisonContextValue>(
    () => ({
      lists,
      count: keys.size,
      isReady,
      isInComparison: (productKey: string) => keys.has(productKey),
      getList: (listId: string) => lists.find((list) => list.id === listId),
      toggle,
      remove,
      removeList,
      error,
      clearError,
    }),
    [lists, keys, isReady, toggle, remove, removeList, error, clearError]
  );

  return (
    <ComparisonContext.Provider value={value}>
      {children}
      <ErrorToast message={error} onClose={clearError} />
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const ctx = useContext(ComparisonContext);
  if (!ctx) {
    throw new Error("useComparison має використовуватися всередині ComparisonProvider");
  }
  return ctx;
}