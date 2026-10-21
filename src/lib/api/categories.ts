import { cache } from "react";
import type { Category } from "../../types/category";
import type { ApiCategoryTree } from "../../types/api";
import { categories as mockCategories } from "../../data/categories";
import { apiFetch } from "./client";
import { mapCategory, mapCategoryTree } from "./mappers";
import { USE_MOCKS } from "./mode";

const FAKE_DELAY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), FAKE_DELAY_MS));
}

export const getCategoryTree = cache(() => apiFetch<ApiCategoryTree[]>("/api/v1/categories"));

export async function getCategories(): Promise<Category[]> {
  if (USE_MOCKS) return delay(mockCategories);

  const tree = await getCategoryTree();
  return mapCategoryTree(tree);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  if (USE_MOCKS) {
    return delay(mockCategories.find((category) => category.id === id) ?? null);
  }

  const tree = await getCategoryTree();
  const find = (nodes: ApiCategoryTree[], path: ApiCategoryTree[]): Category | null => {
    for (const node of nodes.filter((item) => item.isActive)) {
      if (node.slug === id || node.id === id) return mapCategory(node, path);
      const child = find(node.children, [...path, node]);
      if (child) return child;
    }
    return null;
  };
  return find(tree, []);
}
