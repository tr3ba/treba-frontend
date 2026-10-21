// История просмотренных товаров. Эндпоинта на бэке нет — храним в браузере (localStorage),
// последние MAX_ITEMS товаров. Если бэк добавит историю — меняется только этот файл.
// Только для клиентских компонентов.

import type { ViewedProduct } from "../../types/viewed";

const STORAGE_KEY = "treba_viewed";
const CHANGE_EVENT = "treba:viewed-change";
const MAX_ITEMS = 20;
const EMPTY: ViewedProduct[] = [];

// Снимок кэшируем по сырой строке: useSyncExternalStore требует тот же объект,
// пока данные не изменились
let cachedRaw: string | null | undefined;
let cachedList: ViewedProduct[] = EMPTY;

function isViewedProduct(value: unknown): value is ViewedProduct {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.price === "string" &&
    typeof item.viewedAt === "string"
  );
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Текущая история, новые сверху. */
export function getViewedSnapshot(): ViewedProduct[] {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedList;

  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedList = Array.isArray(parsed) ? parsed.filter(isViewedProduct) : EMPTY;
  } catch {
    // пошкоджені дані — порожня історія
    cachedList = EMPTY;
  }
  return cachedList;
}

/** На сервере истории нет. */
export function getViewedServerSnapshot(): ViewedProduct[] {
  return EMPTY;
}

/** Подписка на изменения: в этой вкладке (своё событие) и в других (storage). */
export function subscribeViewed(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function write(list: ViewedProduct[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // localStorage недоступний — історія не збережеться
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Записать просмотр: товар поднимается наверх, данные обновляются. */
export function addViewedProduct(product: Omit<ViewedProduct, "viewedAt">): void {
  const rest = getViewedSnapshot().filter((item) => item.id !== product.id);
  write([{ ...product, viewedAt: new Date().toISOString() }, ...rest].slice(0, MAX_ITEMS));
}

export function clearViewedProducts(): void {
  write([]);
}