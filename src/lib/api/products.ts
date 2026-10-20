import { cache } from "react";
import type { Product } from "../../types/product";
import type { ApiCatalogProduct, ApiCategoryTree, ApiPagedResponse } from "../../types/api";
import { ApiError, apiFetch } from "./client";
import { buildRootCategorySlugMap, mapCatalogProduct } from "./mappers";

// Временные решения, пока на бэке нет нужных эндпоинтов:
// - фильтра по slug категории нет -> берём страницу каталога и фильтруем на фронте;
// - признаков «акція / рекомендація» нет -> делим общий список.
// Бэк отдаёт максимум 100 товаров за запрос — для учебной базы этого хватает.

const CATALOG_MAX_SIZE = 100;
const BEST_OFFERS_COUNT = 11;

// cache() — один запрос дерева категорий на один рендер страницы
const getRootSlugMap = cache(async (): Promise<Map<string, string>> => {
  const tree = await apiFetch<ApiCategoryTree[]>("/api/v1/categories");
  return buildRootCategorySlugMap(tree);
});

// Весь каталог — тоже один запрос на рендер (главная зовёт несколько функций подряд)
const getAllProducts = cache(async (): Promise<Product[]> => {
  const [page, rootSlugs] = await Promise.all([
    apiFetch<ApiPagedResponse<ApiCatalogProduct>>("/api/v1/catalog", {
      query: { page: 1, size: CATALOG_MAX_SIZE },
    }),
    getRootSlugMap(),
  ]);
  return page.content.map((dto) => mapCatalogProduct(dto, rootSlugs));
});

/** Все товары каталога (до 100) — для страницы продавца и других выборок. */
export async function getCatalogProducts(): Promise<Product[]> {
  return getAllProducts();
}

export async function getBestOffersProducts(): Promise<Product[]> {
  const all = await getAllProducts();
  return all.slice(0, BEST_OFFERS_COUNT);
}

export async function getRecommendedProducts(): Promise<Product[]> {
  const all = await getAllProducts();
  return all.slice(BEST_OFFERS_COUNT);
}

/** Запасной путь для старых версий бэка без /catalog/{slug}: поиск по каталогу. */
async function findProductBySearch(slug: string): Promise<ApiCatalogProduct | null> {
  const page = await apiFetch<ApiPagedResponse<ApiCatalogProduct>>("/api/v1/catalog", {
    query: { page: 1, size: CATALOG_MAX_SIZE, search: slug },
  });
  return page.content.find((dto) => dto.slug === slug) ?? null;
}

/** Товар по slug (id товара на фронте = slug). Нет такого — null. */
export const getProductById = cache(async (id: string): Promise<Product | null> => {
  const rootSlugs = await getRootSlugMap();

  try {
    const dto = await apiFetch<ApiCatalogProduct>(`/api/v1/catalog/${encodeURIComponent(id)}`);
    return mapCatalogProduct(dto, rootSlugs);
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) throw error;
  }

  // 404: товара нет или бэк ещё без этого эндпоинта — проверяем поиском
  const found = await findProductBySearch(id);
  return found ? mapCatalogProduct(found, rootSlugs) : null;
});

export async function getRelatedProducts(excludeId: string, limit = 6): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.id !== excludeId).slice(0, limit);
}

export async function getSponsoredProducts(excludeId: string, limit = 6): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.id !== excludeId).slice(-limit).reverse();
}

export async function getProductsByCategory(categoryId: string, limit = 12): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.categoryId === categoryId).slice(0, limit);
}

// TODO (шаг 3): заменить на настоящую историю просмотров
export async function getViewedProducts(excludeId: string, limit = 6): Promise<Product[]> {
  const all = await getAllProducts();
  const shuffled = all.filter((p) => p.id !== excludeId).sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}