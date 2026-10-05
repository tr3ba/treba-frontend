import type { Category } from "../../types/category";
import type { ApiCategoryTree } from "../../types/api";
import { categories as mockCategories } from "../../data/categories";
import { apiFetch } from "./client";
import { mapCategoryTree } from "./mappers";
import { USE_MOCKS } from "./mode";

const FAKE_DELAY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), FAKE_DELAY_MS));
}

export async function getCategories(): Promise<Category[]> {
  if (USE_MOCKS) return delay(mockCategories);

  const tree = await apiFetch<ApiCategoryTree[]>("/api/v1/categories");
  return mapCategoryTree(tree);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  if (USE_MOCKS) {
    return delay(mockCategories.find((category) => category.id === id) ?? null);
  }

  // Отдельного эндпоинта по slug нет — ищем в дереве
  const categories = await getCategories();
  return categories.find((category) => category.id === id) ?? null;
}