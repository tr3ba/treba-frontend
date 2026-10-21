import type { Product } from "./product";

// Елемент списку бажань (обраного).
// productKey — Guid товару на бэке (Product.backendId).
// Получать ключ из товара — только через getWishlistKey() из lib/api/wishlist.ts.
export type WishlistItem = {
  productKey: string;
  /** Дата добавления, ISO-строка */
  addedAt: string;
};

/** Данные товара для карточки на странице списка бажань (без описания и характеристик). */
export type WishlistCardProduct = Pick<
  Product,
  "id" | "backendId" | "variantId" | "title" | "price" | "oldPrice" | "image" | "rating" | "isPromo"
>;

// ---------- DTO бэка: GET /api/v1/wishlist ----------
// Лежат здесь, а не в types/api.ts, — пока API избранного используется только в этом модуле.

export type ApiWishlistItem = {
  id: string;
  productId: string;
  productName: string;
  addedAt: string;
};

export type ApiWishlist = {
  id: string;
  name: string;
  defaultWishlist: boolean;
  createdAt: string;
  items: ApiWishlistItem[];
};