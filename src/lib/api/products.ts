import { cache } from "react";
import type { Product } from "../../types/product";
import type { ApiCatalogProduct, ApiCategoryTree, ApiPagedResponse } from "../../types/api";
import { bestOffersProducts, recommendedProducts } from "../../data/products";
import { apiFetch } from "./client";
import { buildRootCategorySlugMap, mapCatalogProduct } from "./mappers";
import { USE_MOCKS } from "./mode";

const FAKE_DELAY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), FAKE_DELAY_MS));
}

const mockProducts = (): Product[] => [...bestOffersProducts, ...recommendedProducts];

// ---------- Работа с бэком ----------
// Временные решения, пока на бэке нет нужных эндпоинтов:
// - товара по slug нет -> ищем через /catalog?search=slug;
// - фильтра по категории нет -> берём страницу каталога и фильтруем на фронте;
// - признаков «акція / рекомендація» нет -> делим общий список.
// Бэк отдаёт максимум 100 товаров за запрос — для учебной базы этого хватает.

const CATALOG_MAX_SIZE = 100;
const BEST_OFFERS_COUNT = 11;

// cache() — один запрос дерева категорий на один рендер страницы
const getRootSlugMap = cache(async (): Promise<Map<string, string>> => {
  const tree = await apiFetch<ApiCategoryTree[]>("/api/v1/categories");
  return buildRootCategorySlugMap(tree);
});

async function fetchCatalog(search?: string): Promise<Product[]> {
  const [page, rootSlugs] = await Promise.all([
    apiFetch<ApiPagedResponse<ApiCatalogProduct>>("/api/v1/catalog", {
      query: { page: 1, size: CATALOG_MAX_SIZE, search },
    }),
    getRootSlugMap(),
  ]);
  return page.content.map((dto) => mapCatalogProduct(dto, rootSlugs));
}

// Весь каталог — тоже один запрос на рендер (главная зовёт несколько функций подряд)
const getAllProducts = cache(() => fetchCatalog());

// ---------- Публичные функции ----------

export async function getBestOffersProducts(): Promise<Product[]> {
  if (USE_MOCKS) return delay(bestOffersProducts);
  const all = await getAllProducts();
  return all.slice(0, BEST_OFFERS_COUNT);
}

export async function getRecommendedProducts(): Promise<Product[]> {
  if (USE_MOCKS) return delay(recommendedProducts);
  const all = await getAllProducts();
  return all.slice(BEST_OFFERS_COUNT);
}

export async function getProductById(id: string): Promise<Product | null> {
  if (USE_MOCKS) return delay(mockProducts().find((p) => p.id === id) ?? null);

  // id товара = slug; поиск бэка ищет и по slug, точное совпадение проверяем сами
  const found = await fetchCatalog(id);
  return found.find((p) => p.id === id) ?? null;
}

export async function getRelatedProducts(excludeId: string, limit = 6): Promise<Product[]> {
  const all = USE_MOCKS ? mockProducts() : await getAllProducts();
  const related = all.filter((p) => p.id !== excludeId).slice(0, limit);
  return USE_MOCKS ? delay(related) : related;
}

export async function getSponsoredProducts(excludeId: string, limit = 6): Promise<Product[]> {
  const all = USE_MOCKS ? mockProducts() : await getAllProducts();
  const sponsored = all.filter((p) => p.id !== excludeId).slice(-limit).reverse();
  return USE_MOCKS ? delay(sponsored) : sponsored;
}

export async function getProductsByCategory(categoryId: string, limit = 12): Promise<Product[]> {
  if (USE_MOCKS) {
    const all = mockProducts();
    const inCategory = all.filter((p) => p.categoryId === categoryId);
    const result = inCategory.length > 0 ? inCategory : all;
    return delay(result.slice(0, limit));
  }

  // С бэком показываем только товары этой категории (без подмены «всеми товарами»)
  const all = await getAllProducts();
  return all.filter((p) => p.categoryId === categoryId).slice(0, limit);
}

export async function getViewedProducts(excludeId: string, limit = 6): Promise<Product[]> {
  const all = USE_MOCKS ? mockProducts() : await getAllProducts();
  const shuffled = all.filter((p) => p.id !== excludeId).sort(() => Math.random() - 0.5);
  const result = shuffled.slice(0, limit);
  return USE_MOCKS ? delay(result) : result;
}