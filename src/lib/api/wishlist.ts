// API избранного (список бажань). Только для клиентских компонентов.
// Бэк: GET /api/v1/wishlist, POST|DELETE /api/v1/wishlist/products/{guid} — с авторизацией,
// поэтому ходим через прокси /shop-api/wishlist (токен в HttpOnly-куке).
// Моки: localStorage, отдельный список для каждого пользователя.

import type { Product } from "../../types/product";
import type { ApiWishlist, WishlistItem } from "../../types/wishlist";
import { USE_MOCKS } from "./mode";

const FAKE_DELAY_MS = 300;
const MOCK_KEY_PREFIX = "treba_wishlist_";
const PROXY_URL = "/shop-api/wishlist";

/** Ошибка избранного. message — готовый текст для UI (укр.). */
export class WishlistError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "WishlistError";
    this.status = status;
  }
}

/** Ключ товара в избранном: Guid с бэка, на моках — slug. */
export function getWishlistKey(product: Pick<Product, "id" | "backendId">): string {
  return product.backendId ?? product.id;
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), FAKE_DELAY_MS));
}

// ---------- Моки ----------

function isWishlistItem(value: unknown): value is WishlistItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.productKey === "string" && typeof item.addedAt === "string";
}

function readMock(userId: string): WishlistItem[] {
  try {
    const raw = window.localStorage.getItem(MOCK_KEY_PREFIX + userId);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isWishlistItem) : [];
  } catch {
    // пошкоджені дані або localStorage недоступний — порожній список
    return [];
  }
}

function writeMock(userId: string, items: WishlistItem[]): void {
  try {
    window.localStorage.setItem(MOCK_KEY_PREFIX + userId, JSON.stringify(items));
  } catch {
    // localStorage недоступний — зміни не збережуться після перезавантаження
  }
}

// ---------- Бэк ----------

function messageForStatus(status: number): string {
  if (status === 0 || status === 503) return "Сервер недоступний. Спробуйте пізніше.";
  if (status === 401) return "Увійдіть в акаунт, щоб зберігати товари в списку бажань.";
  if (status === 404) return "Товар не знайдено.";
  return "Не вдалося оновити список бажань. Спробуйте ще раз.";
}

async function request(path: string, method: "GET" | "POST" | "DELETE"): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(PROXY_URL + path, { method, cache: "no-store" });
  } catch {
    throw new WishlistError(0, messageForStatus(0));
  }
  if (!response.ok) throw new WishlistError(response.status, messageForStatus(response.status));
  return response;
}

// ---------- Публичные функции ----------
// userId нужен только мокам (у каждого пользователя свой список); бэк берёт его из токена.

/** Список бажань пользователя, новые сверху. */
export async function getWishlist(userId: string): Promise<WishlistItem[]> {
  if (USE_MOCKS) return delay(readMock(userId));

  const response = await request("", "GET");
  const data = (await response.json()) as ApiWishlist;
  return data.items.map((item) => ({ productKey: item.productId, addedAt: item.addedAt }));
}

export async function addToWishlist(userId: string, productKey: string): Promise<void> {
  if (USE_MOCKS) {
    const items = readMock(userId);
    if (!items.some((item) => item.productKey === productKey)) {
      writeMock(userId, [{ productKey, addedAt: new Date().toISOString() }, ...items]);
    }
    await delay(undefined);
    return;
  }

  await request(`/products/${encodeURIComponent(productKey)}`, "POST");
}

export async function removeFromWishlist(userId: string, productKey: string): Promise<void> {
  if (USE_MOCKS) {
    writeMock(
      userId,
      readMock(userId).filter((item) => item.productKey !== productKey)
    );
    await delay(undefined);
    return;
  }

  await request(`/products/${encodeURIComponent(productKey)}`, "DELETE");
}