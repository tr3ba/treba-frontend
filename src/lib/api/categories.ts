import { cache } from "react";
import type { Category } from "../../types/category";
import type { ApiCategoryTree } from "../../types/api";
import { apiFetch } from "./client";
import { mapCategory, mapCategoryTree } from "./mappers";

export const getCategoryTree = cache(() => apiFetch<ApiCategoryTree[]>("/api/v1/categories"));

export const getCategories = cache(async (): Promise<Category[]> => {
  const tree = await getCategoryTree();
  return mapCategoryTree(tree);
});

export async function getCategoryById(id: string): Promise<Category | null> {
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
