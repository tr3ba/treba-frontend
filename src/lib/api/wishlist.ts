// API избранного (список бажань). Только для клиентских компонентов.
// Бэк: GET /api/v1/wishlist, POST|DELETE /api/v1/wishlist/products/{guid} — с авторизацией,
// поэтому ходим через прокси /shop-api/wishlist (токен в HttpOnly-куке).
// Пользователя бэк берёт из токена — userId передавать не нужно.

import type { Product } from "../../types/product";
import type { ApiWishlist, WishlistItem } from "../../types/wishlist";

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

/** Ключ товара в избранном — Guid с бэка (Product.backendId). */
export function getWishlistKey(product: Pick<Product, "id" | "backendId">): string {
  // id (slug) — только запасной вариант: прокси примет лишь Guid и вернёт понятную ошибку
  return product.backendId ?? product.id;
}

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

/** Список бажань текущего пользователя, новые сверху. */
export async function getWishlist(): Promise<WishlistItem[]> {
  const response = await request("", "GET");
  const data = (await response.json()) as ApiWishlist;
  return data.items.map((item) => ({ productKey: item.productId, addedAt: item.addedAt }));
}

export async function addToWishlist(productKey: string): Promise<void> {
  await request(`/products/${encodeURIComponent(productKey)}`, "POST");
}

export async function removeFromWishlist(productKey: string): Promise<void> {
  await request(`/products/${encodeURIComponent(productKey)}`, "DELETE");
}