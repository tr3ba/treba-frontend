import { cache } from "react";
import type { Category } from "../../types/category";
import type { ApiCategoryTree } from "../../types/api";
import { apiFetch } from "./client";
import { mapCategoryTree } from "./mappers";

// cache() — layout и страница запрашивают категории за один рендер несколько раз
export const getCategories = cache(async (): Promise<Category[]> => {
  const tree = await apiFetch<ApiCategoryTree[]>("/api/v1/categories");
  return mapCategoryTree(tree);
});

export async function getCategoryById(id: string): Promise<Category | null> {
  // Отдельного эндпоинта по slug нет — ищем в дереве
  const categories = await getCategories();
  return categories.find((category) => category.id === id) ?? null;
}