// API публичной страницы продавца (/seller/[id]).
// Продавец = магазин (Store). Компоненты берут данные только отсюда.
//
// Что сейчас есть на бэке и чего нет:
// - товары: публичный /api/v1/catalog без фильтра по магазину (максимум 100 шт.) ->
//   берём каталог и фильтруем по storeId на фронте. Когда бэк добавит параметр storeId
//   и счётчики по категориям — меняем только getSellerProducts;
// - профиль магазина: публичного GET /api/v1/stores/{id} нет -> название берём из товаров;
// - рейтинга, отзывов о продавце, графика работы на бэке нет -> страница показывает пустые состояния.

import { cache } from "react";
import type { Product } from "../../types/product";
import type {
  SellerCategoryCount,
  SellerProductsQuery,
  SellerProductsResult,
  SellerProductsSort,
  SellerProfile,
  SellerReview,
  SellerReviewsSort,
} from "../../types/seller";
import { getCategories } from "./categories";
import { getCatalogProducts } from "./products";
import { parsePrice } from "../format";

const DEFAULT_PAGE_SIZE = 20;

// cache() — layout и страница вкладки вызывают одно и то же за один рендер
const getProductsOfSeller = cache(async (sellerId: string): Promise<Product[]> => {
  const all = await getCatalogProducts();
  return all.filter((product) => product.seller?.id === sellerId);
});

// ---------- Профиль ----------

export const getSellerById = cache(async (id: string): Promise<SellerProfile | null> => {
  // Профиля магазина на бэке нет: магазин «существует», если у него есть товары
  const products = await getProductsOfSeller(id);
  const seller = products[0]?.seller;
  if (!seller) return null;

  return { id: seller.id, name: seller.name, logo: seller.logo };
});

// ---------- Товары ----------

function sortProducts(products: Product[], sort: SellerProductsSort): Product[] {
  const list = [...products];
  if (sort === "priceAsc") return list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
  if (sort === "priceDesc") return list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
  // popular: сначала с высоким рейтингом, без рейтинга — в конце
  return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
}

async function countByCategory(products: Product[]): Promise<SellerCategoryCount[]> {
  const counts = new Map<string, number>();
  for (const product of products) {
    if (!product.categoryId) continue;
    counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
  }

  const categories = await getCategories();
  return [...counts.entries()]
    .map(([categoryId, count]) => ({
      categoryId,
      label: categories.find((category) => category.id === categoryId)?.label ?? "Інше",
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "uk"));
}

export async function getSellerProducts(
  sellerId: string,
  query: SellerProductsQuery = {}
): Promise<SellerProductsResult> {
  const { categoryId, sort = "popular", pageSize = DEFAULT_PAGE_SIZE } = query;

  const all = await getProductsOfSeller(sellerId);
  const categories = await countByCategory(all);

  const filtered = categoryId ? all.filter((product) => product.categoryId === categoryId) : all;
  const sorted = sortProducts(filtered, sort);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(Math.max(1, query.page ?? 1), totalPages);
  const start = (page - 1) * pageSize;

  return {
    products: sorted.slice(start, start + pageSize),
    total: sorted.length,
    totalAll: all.length,
    categories,
    page,
    pageSize,
    totalPages,
  };
}

// ---------- Отзывы о продавце ----------

function reviewAverage(review: SellerReview): number {
  const { service, delivery, accuracy } = review.scores;
  return (service + delivery + accuracy) / 3;
}

// Эндпоинта отзывов о магазине на бэке нет. Когда появится — здесь будет apiFetch,
// сортировка и компоненты останутся как есть.
async function fetchSellerReviews(sellerId: string): Promise<SellerReview[]> {
  void sellerId;
  return [];
}

export async function getSellerReviews(
  sellerId: string,
  sort: SellerReviewsSort = "newest"
): Promise<SellerReview[]> {
  const list = [...(await fetchSellerReviews(sellerId))];
  if (sort === "highest") list.sort((a, b) => reviewAverage(b) - reviewAverage(a));
  else if (sort === "lowest") list.sort((a, b) => reviewAverage(a) - reviewAverage(b));
  else list.sort((a, b) => b.date.localeCompare(a.date));
  return list;
}

/** Количество отзывов — для счётчика на вкладке «Відгуки». */
export async function getSellerReviewsCount(sellerId: string): Promise<number> {
  return (await fetchSellerReviews(sellerId)).length;
}