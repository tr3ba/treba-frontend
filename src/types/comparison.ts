import type { Product } from "./product";

// Порівняння товарів.
// Списки групуються за кінцевою категорією товару — як у Rozetka: «Веб-камери», «Геймерські крісла».

/** Товар у списку порівняння. productKey — slug товару (Product.id). */
export type ComparisonItem = {
  productKey: string;
  /** Дата додавання, ISO-строка */
  addedAt: string;
};

export type ComparisonList = {
  /** id списку = id кінцевої категорії на бэке (Guid) */
  id: string;
  /** Назва категорії — заголовок списку */
  title: string;
  /** Slug категорії верхнього рівня — для «Додати ще модель» */
  catalogCategoryId?: string;
  /** Товари в порядку додавання */
  items: ComparisonItem[];
  /** Дата останньої зміни, ISO-строка — нові списки зверху */
  updatedAt: string;
};

/** Мінімум даних товару, щоб додати його до порівняння. */
export type ComparisonProduct = Pick<
  Product,
  "id" | "categoryId" | "subcategoryId" | "subcategoryName"
>;

/** Результат перемикання: додано / прибрано / нічого не змінилося (гість, ліміт, помилка). */
export type ComparisonToggleResult = "added" | "removed" | null;

/** Дані товару для сторінки порівняння: шапка-картка + рядки таблиці. */
export type ComparisonCardProduct = Pick<
  Product,
  | "id"
  | "backendId"
  | "variantId"
  | "title"
  | "price"
  | "oldPrice"
  | "image"
  | "rating"
  | "reviewsCount"
  | "isPromo"
  | "inStock"
  | "code"
  | "brand"
  | "subcategoryName"
  | "warrantyMonths"
  | "countryOfOrigin"
  | "seller"
  | "characteristics"
>;