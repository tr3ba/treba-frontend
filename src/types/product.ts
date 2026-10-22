// Характеристика товару
export type ProductCharacteristic = {
  label: string;
  value: string;
};

// Варіант товару
export type ProductVariant = {
  id: string;
  label: string;
  image: string;
  colorHex?: string;
  available: boolean;
};

// Продавец товара = магазин (не бренд). Полный профиль — SellerProfile в types/seller.ts
export type Seller = {
  id: string;
  name: string;
  logo?: string;
  /** Рейтинг продавца (за всё время) — для блока на странице товара. */
  rating?: number;
  ratingCount?: number;
};

// Супутній товар-аксесуар
export type ProductAccessory = {
  id: string;
  title: string;
  image: string;
  price: string;
  oldPrice?: string | null;
};

// Додаткова послуга
export type ProductService = {
  id: string;
  title: string;
  description: string;
  price: string;
};

export type Product = {
  id: string;
  backendId?: string;
  /** Guid варианта по умолчанию — нужен корзине и заказу на бэке */
  variantId?: string;
  title: string;
  price: string;
  oldPrice?: string | null;
  image?: string;
  rating?: number;
  isPromo?: boolean;
  /** Slug категорії ВЕРХНЬОГО рівня (для хлібних крихт і каталогу) */
  categoryId?: string;
  /** Кінцева категорія товару на бэке (Guid) — за нею групуються списки порівняння */
  subcategoryId?: string;
  /** Назва кінцевої категорії: «Веб-камери», «Геймерські крісла» */
  subcategoryName?: string;
  inStock?: boolean;

  // Поля
  code?: string;
  brand?: string;
  /** Гарантія в місяцях; немає — не вказана */
  warrantyMonths?: number;
  countryOfOrigin?: string;
  description?: string;
  reviewsCount?: number;
  images?: string[];
  seller?: Seller;
  characteristics?: ProductCharacteristic[];
  variants?: ProductVariant[];
  accessories?: ProductAccessory[];
  services?: ProductService[];
};