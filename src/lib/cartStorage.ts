// Корзина гостя и «вариант -> slug» в браузере (localStorage).
// Читается через useSyncExternalStore — без setState в эффекте.

import type { CartItem } from "../types/cart";

const CART_KEY = "treba_cart";
const LINKS_KEY = "treba_cart_links";
const CHANGE_EVENT = "treba:cart-change";
const MAX_LINKS = 200;
const EMPTY: CartItem[] = [];

let cachedRaw: string | null | undefined;
let cachedItems: CartItem[] = EMPTY;

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.price === "number" &&
    typeof item.quantity === "number"
  );
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

// ---------- Корзина гостя ----------

export function getGuestCartSnapshot(): CartItem[] {
  const raw = readRaw(CART_KEY);
  if (raw === cachedRaw) return cachedItems;

  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedItems = Array.isArray(parsed)
      ? parsed.filter(isCartItem).map((item) => ({ ...item, slug: item.slug ?? item.id }))
      : EMPTY;
  } catch {
    // пошкоджені дані — порожній кошик
    cachedItems = EMPTY;
  }
  return cachedItems;
}

export function getGuestCartServerSnapshot(): CartItem[] {
  return EMPTY;
}

export function subscribeGuestCart(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === CART_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function writeGuestCart(items: CartItem[]): void {
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // localStorage недоступний — кошик не збережеться
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// ---------- «вариант -> slug» (бэк не отдаёт slug в корзине) ----------

export function readCartLinks(): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(readRaw(LINKS_KEY) ?? "{}");
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const links: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") links[key] = value;
    }
    return links;
  } catch {
    return {};
  }
}

export function rememberCartLink(variantId: string, slug: string): void {
  const links = readCartLinks();
  if (links[variantId] === slug) return;
  delete links[variantId];
  links[variantId] = slug;
  // храним только последние MAX_LINKS
  const trimmed = Object.fromEntries(Object.entries(links).slice(-MAX_LINKS));
  try {
    window.localStorage.setItem(LINKS_KEY, JSON.stringify(trimmed));
  } catch {
    // не страшно: позиция просто покажется без ссылки
  }
}