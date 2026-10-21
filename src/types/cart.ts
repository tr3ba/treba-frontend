// ---------- Корзина в UI ----------

/** Позиция корзины в интерфейсе (и для гостя, и для вошедшего). */
export type CartItem = {
  /** Ключ позиции: slug товара (или `variant:<guid>`, если slug неизвестен) */
  id: string;
  /** slug для ссылки на страницу товара; нет — показываем без ссылки */
  slug?: string;
  /** Guid варианта — его отправляем в корзину/заказ на бэке */
  variantId?: string;
  /** Id позиции в корзине на бэке (только у вошедшего) */
  lineId?: string;
  title: string;
  image?: string;
  price: number;
  oldPrice: number | null;
  quantity: number;
  /** false — товар больше не продаётся */
  available?: boolean;
};

/** Что передаёт кнопка «В кошик» при добавлении. */
export type AddToCartInput = {
  /** slug товара */
  id: string;
  variantId?: string;
  title: string;
  price: string;
  oldPrice?: string | null;
  image?: string;
};

// ---------- Позиция корзины на бэке (после маппинга) ----------
// Ключ позиции — lineId (CartItem.Id на бэке), товар определяется вариантом (variantId).
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