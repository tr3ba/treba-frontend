import type { ApiCatalogProduct, ApiPagedResponse } from "../../types/api";
import type { CatalogQuery } from "../catalogQuery";
import { apiFetch } from "./client";
import { getCategoryTree } from "./categories";
import { buildRootCategorySlugMap, mapCatalogProduct } from "./mappers";
export type PublicFacets = { brands: { id: string; name: string }[]; attributes: { id: string; name: string; options: { value: string; label: string }[] }[] };

export async function searchCatalog(query: CatalogQuery, categoryId?: string) {
  const filters: Record<string, string | number | undefined> = { page: query.page, size: 24, search: query.q, sort: query.sort, brandId: query.brandId, minPrice: query.minPrice, maxPrice: query.maxPrice, stock: query.stock, categoryId };
  for (const [id, value] of Object.entries(query.attributes)) filters[`attributes[${id}]`] = value;
  const [page, tree] = await Promise.all([apiFetch<ApiPagedResponse<ApiCatalogProduct>>("/api/v1/catalog", { query: filters }), getCategoryTree()]);
  const roots = buildRootCategorySlugMap(tree);
  return { ...page, content: page.content.map(item => mapCatalogProduct(item, roots)) };
}
export const getPublicFacets = (query: CatalogQuery, categoryId?: string) => apiFetch<PublicFacets>("/api/v1/catalog/facets", { query: { search: query.q, categoryId } });
