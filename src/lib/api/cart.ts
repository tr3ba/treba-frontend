// Корзина на бэке (/api/v1/cart) — только для вошедших пользователей.
// Ходим через прокси /shop-api/cart: токен в HttpOnly-куке. Только для клиентских компонентов.
// Каждый запрос, кроме очистки, возвращает всю корзину — после действия берём свежее состояние.

import type { ApiCart, ApiCartItem, ServerCartItem } from "../../types/cart";
import { resolveMediaUrl } from "./client";

const PROXY_URL = "/shop-api/cart";

/** Ошибка корзины. message — готовый текст для UI (укр.). */
export class CartError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "CartError";
    this.status = status;
  }
}

function messageForStatus(status: number): string {
  if (status === 0 || status === 503) return "Сервер недоступний. Спробуйте пізніше.";
  if (status === 401) return "Увійдіть в акаунт, щоб зберегти кошик.";
  if (status === 404) return "Товар більше недоступний.";
  if (status === 400 || status === 409) return "Цей товар зараз не можна додати до кошика.";
  return "Не вдалося оновити кошик. Спробуйте ще раз.";
}

function mapCartItem(dto: ApiCartItem): ServerCartItem {
  return {
    lineId: dto.id,
    variantId: dto.productVariantId,
    productBackendId: dto.productId,
    title: dto.productName,
    variantName: dto.variantName,
    image: resolveMediaUrl(dto.imageUrl) ?? undefined,
    price: dto.price,
    // Старая цена имеет смысл, только если она больше текущей
    oldPrice: dto.oldPrice !== null && dto.oldPrice > dto.price ? dto.oldPrice : null,
    quantity: dto.quantity,
    available: dto.isAvailable,
  };
}

async function request(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: Record<string, unknown>
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(PROXY_URL + path, {
      method,
      cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new CartError(0, messageForStatus(0));
  }
  if (!response.ok) throw new CartError(response.status, messageForStatus(response.status));
  return response;
}

async function readCart(response: Response): Promise<ServerCartItem[]> {
  const cart = (await response.json()) as ApiCart;
  return cart.items.map(mapCartItem);
}

/** Корзина текущего пользователя. */
export async function getServerCart(): Promise<ServerCartItem[]> {
  return readCart(await request("", "GET"));
}

/** Добавить вариант (если уже есть — бэк увеличит количество). */
export async function addServerCartItem(variantId: string, quantity: number): Promise<ServerCartItem[]> {
  return readCart(await request("/items", "POST", { productVariantId: variantId, quantity }));
}

export async function updateServerCartItem(lineId: string, quantity: number): Promise<ServerCartItem[]> {
  return readCart(await request(`/items/${encodeURIComponent(lineId)}`, "PATCH", { quantity }));
}

export async function removeServerCartItem(lineId: string): Promise<ServerCartItem[]> {
  return readCart(await request(`/items/${encodeURIComponent(lineId)}`, "DELETE"));
}

export async function clearServerCart(): Promise<void> {
  await request("", "DELETE");
}