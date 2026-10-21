// Позиция корзины на бэке (после маппинга). Ключ позиции — lineId (CartItem.Id на бэке),
// товар определяется вариантом (variantId).
export type ServerCartItem = {
  lineId: string;
  variantId: string;
  /** Guid товара */
  productBackendId: string;
  title: string;
  /** Название варианта («Основний», «Чорний, 128 ГБ») */
  variantName: string;
  image?: string;
  price: number;
  oldPrice: number | null;
  quantity: number;
  /** false — вариант больше не продаётся или закончился */
  available: boolean;
};

// ---------- DTO бэка: /api/v1/cart ----------

export type ApiCartItem = {
  id: string;
  productVariantId: string;
  productId: string;
  productName: string;
  variantName: string;
  imageUrl: string | null;
  price: number;
  oldPrice: number | null;
  quantity: number;
  totalPrice: number;
  isAvailable: boolean;
};

export type ApiCart = {
  id: string;
  userId: string;
  items: ApiCartItem[];
  totalQuantity: number;
  totalPrice: number;
};