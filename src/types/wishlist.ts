// Елемент списку бажань (обраного).
// productKey — backendId товару (Guid) при роботі з бэком, id (slug) — на моках.
// Получать ключ из товара — только через getWishlistKey() из lib/api/wishlist.ts.
export type WishlistItem = {
  productKey: string;
  /** Дата добавления, ISO-строка */
  addedAt: string;
};

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