// Перевод DTO бэка в типы фронта.
// Компоненты работают только с нашими типами — при изменениях API правим только этот файл.

import type { ApiCatalogProduct, ApiCategoryTree } from "../../types/api";
import type { Category } from "../../types/category";
import type { Product } from "../../types/product";
import { categories as mockCategories } from "../../data/categories";
import { formatPrice } from "../format";
import { resolveMediaUrl } from "./client";

const DEFAULT_CATEGORY_ICON = "/icons/catalog.svg";

function bySortOrder(a: ApiCategoryTree, b: ApiCategoryTree): number {
  return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "uk");
}

function activeSorted(nodes: ApiCategoryTree[]): ApiCategoryTree[] {
  return nodes.filter((node) => node.isActive).sort(bySortOrder);
}

// ---------- Категории ----------

/**
 * Узел верхнего уровня -> наша Category.
 * Уровень 2 (children) -> колонки subcategories, уровень 3 -> пункты колонок.
 * Иконки и картинки колонок на бэке пока не хранятся — если их нет,
 * берём из мок-категории с таким же slug (и мок-колонки с таким же названием).
 */
export function mapCategory(node: ApiCategoryTree): Category {
  const mock = mockCategories.find((category) => category.id === node.slug);

  return {
    id: node.slug,
    label: node.name,
    icon: mock?.icon ?? resolveMediaUrl(node.imageUrl) ?? DEFAULT_CATEGORY_ICON,
    description: node.description ?? undefined,
    subcategories: activeSorted(node.children).map((column) => {
      const mockColumn = mock?.subcategories?.find((item) => item.title === column.name);
      return {
        title: column.name,
        image: resolveMediaUrl(column.imageUrl) ?? mockColumn?.image,
        items: activeSorted(column.children).map((item) => item.name),
      };
    }),
  };
}

/** Дерево категорий -> список категорий верхнего уровня. */
export function mapCategoryTree(tree: ApiCategoryTree[]): Category[] {
  return activeSorted(tree.filter((node) => node.parentId === null)).map(mapCategory);
}

/**
 * Карта Guid категории (любого уровня) -> slug её категории ВЕРХНЕГО уровня.
 * Наши Category — это только верхний уровень, поэтому товар из «Зволожувачі повітря»
 * относим к «Побутова техніка»: по нему строятся хлебные крошки и фильтр по категории.
 */
export function buildRootCategorySlugMap(tree: ApiCategoryTree[]): Map<string, string> {
  const map = new Map<string, string>();
  const walk = (nodes: ApiCategoryTree[], rootSlug: string) => {
    for (const node of nodes) {
      map.set(node.id, rootSlug);
      walk(node.children, rootSlug);
    }
  };
  for (const root of tree) {
    map.set(root.id, root.slug);
    walk(root.children, root.slug);
  }
  return map;
}

// ---------- Товары ----------

/**
 * Товар каталога -> наш Product.
 * rootSlugByCategoryId (из buildRootCategorySlugMap) — чтобы categoryId товара
 * совпадал с id наших категорий верхнего уровня (slug).
 */
export function mapCatalogProduct(
  dto: ApiCatalogProduct,
  rootSlugByCategoryId?: Map<string, string>
): Product {
  // Бэк уже сортирует фото: главное первым
  const images = dto.images
    .map((image) => resolveMediaUrl(image.imageUrl))
    .filter((url): url is string => Boolean(url));

  return {
    id: dto.slug,
    title: dto.name,
    price: formatPrice(dto.price),
    oldPrice: null, // бэк пока не отдаёт старую цену в каталоге
    image: images[0],
    images,
    categoryId: rootSlugByCategoryId?.get(dto.categoryId) ?? dto.categoryId,
    inStock: dto.stockQuantity > 0,
    code: dto.sku,
    description: dto.description || dto.shortDescription,
    seller: { id: dto.brandId, name: dto.brandName },
  };
}