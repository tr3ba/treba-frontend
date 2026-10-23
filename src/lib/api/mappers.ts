// Перевод DTO бэка в типы фронта.
// Компоненты работают только с нашими типами — при изменениях API правим только этот файл.

import type { ApiCatalogProduct, ApiCategoryTree } from "../../types/api";
import type { Category } from "../../types/category";
import type { Product } from "../../types/product";
import { categories as staticCategories } from "../../data/categories";
import { formatPrice } from "../format";
import { resolveMediaUrl } from "./client";

const DEFAULT_CATEGORY_ICON = "/icons/catalog.svg";
const ADDITIONAL_CATEGORY_ICONS: Record<string, string> = {
  "rz-c80260": "/icons/certificates.svg",
  "rz-c83850": "/icons/discount.svg",
  "rz-c4630262": "/icons/warranty.svg",
};

function bySortOrder(a: ApiCategoryTree, b: ApiCategoryTree): number {
  return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "uk");
}

function activeSorted(nodes: ApiCategoryTree[]): ApiCategoryTree[] {
  return nodes.filter((node) => node.isActive).sort(bySortOrder);
}

// ---------- Категории ----------

/**
 * Узел любого уровня -> Category с прямыми потомками и хлебными крошками.
 * В меню используем локальные иконки; фотографии API остаются в карточках подразделов.
 */
export function mapCategory(node: ApiCategoryTree, ancestors: ApiCategoryTree[] = []): Category {
  const local = staticCategories.find((category) => category.id === node.slug);

  return {
    id: node.slug,
    label: node.name,
    backendId: node.id,
    path: ancestors.map((parent) => ({ id: parent.slug, label: parent.name })),
    icon: local?.icon ?? ADDITIONAL_CATEGORY_ICONS[node.slug] ?? DEFAULT_CATEGORY_ICON,
    description: node.description ?? undefined,
    subcategories: activeSorted(node.children).map((column) => {
      const localColumn = local?.subcategories?.find((item) => item.title === column.name);
      return {
        title: column.name,
        id: column.slug,
        itemLinks: activeSorted(column.children).map((item) => ({ id: item.slug, label: item.name })),
        image: resolveMediaUrl(column.imageUrl) ?? localColumn?.image,
        items: activeSorted(column.children).map((item) => item.name),
      };
    }),
  };
}

/** Дерево категорий -> список категорий верхнего уровня. */
export function mapCategoryTree(tree: ApiCategoryTree[]): Category[] {
  return activeSorted(tree.filter((node) => node.parentId === null)).map((node) => mapCategory(node));
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

  // Старая цена имеет смысл, только если она больше текущей
  const oldPrice = dto.oldPrice ?? 0;
  const hasDiscount = oldPrice > dto.price;

  return {
    id: dto.slug,
    backendId: dto.id,
    variantId: dto.productVariantId ?? undefined,
    title: dto.name,
    price: formatPrice(dto.price),
    oldPrice: hasDiscount ? formatPrice(oldPrice) : null,
    isPromo: hasDiscount,
    image: images[0],
    images,
    categoryId: rootSlugByCategoryId?.get(dto.categoryId) ?? dto.categoryId,
    subcategoryId: dto.categoryId,
    subcategoryName: dto.categoryName || undefined,
    inStock: dto.stockQuantity > 0,
    code: dto.sku,
    brand: dto.brandName || undefined,
    warrantyMonths: dto.warrantyMonths > 0 ? dto.warrantyMonths : undefined,
    countryOfOrigin: dto.countryOfOrigin || undefined,
    description: dto.description || dto.shortDescription,
    // Продавец = магазин (Store), а не бренд
    seller: {
      id: dto.storeId,
      name: dto.storeName || dto.sellerName || "Продавець TREBA",
    },
  };
}