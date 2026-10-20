// Публичная страница продавца (/seller/[id]).
// Продавец = магазин (Store на бэке): id магазина, название, логотип.

import type { Product } from "./product";

/** Оценка 1–5 -> сколько отзывов с ней. */
export type RatingDistribution = Record<1 | 2 | 3 | 4 | 5, number>;

/** Период, за который считается рейтинг. */
export type SellerRatingPeriod = "30d" | "6m" | "all";

/** Критерии, по которым покупатели оценивают продавца. */
export type SellerRatingCriterion = "service" | "delivery" | "accuracy";

export type SellerPeriodRating = {
  average: number;
  count: number;
  distribution: RatingDistribution;
};

export type SellerRating = {
  /** Итоговый рейтинг (за всё время) — для шапки и блока на странице товара. */
  average: number;
  count: number;
  byPeriod: Record<SellerRatingPeriod, SellerPeriodRating>;
  /** Средняя оценка по каждому критерию и периоду. */
  criteria: Record<SellerRatingCriterion, Record<SellerRatingPeriod, number>>;
};

/** Строка графика работы. hours = null — выходной. */
export type SellerScheduleItem = {
  days: string;
  hours: string | null;
};

/** Показатели сервиса: скорость отправки, доставки, жалобы. */
export type SellerServiceStats = {
  shippingHours: number;
  deliveryDays: number;
  complaintsPercent: number;
};

export type SellerProfile = {
  /** id магазина (на бэке — Guid, в моках — slug). */
  id: string;
  name: string;
  logo?: string;
  description?: string;
  /** Юридическое название компании-продавца. */
  companyName?: string;
  /** Дата появления на TREBA (ISO). */
  joinedAt?: string;
  rating?: SellerRating;
  schedule?: SellerScheduleItem[];
  minOrderAmount?: number;
  stats?: SellerServiceStats;
};

// ---------- Отзывы о продавце ----------

export type SellerReviewReply = {
  text: string;
  date: string; // ISO
};

export type SellerReview = {
  id: string;
  author: string;
  date: string; // ISO
  scores: Record<SellerRatingCriterion, number>;
  text?: string;
  reply?: SellerReviewReply;
};

export type SellerReviewsSort = "newest" | "highest" | "lowest";

// ---------- Товары продавца ----------

export type SellerProductsSort = "popular" | "priceAsc" | "priceDesc";

export type SellerProductsQuery = {
  /** id (slug) категории верхнего уровня; не задано — все товары. */
  categoryId?: string;
  sort?: SellerProductsSort;
  page?: number;
  pageSize?: number;
};

/** Категория в боковом меню: название и сколько в ней товаров продавца. */
export type SellerCategoryCount = {
  categoryId: string;
  label: string;
  count: number;
};

export type SellerProductsResult = {
  products: Product[];
  /** Товаров с учётом выбранной категории. */
  total: number;
  /** Всего товаров продавца. */
  totalAll: number;
  categories: SellerCategoryCount[];
  page: number;
  pageSize: number;
  totalPages: number;
};