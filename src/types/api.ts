// ---------- Общее ----------

/** Страница результатов (пагинация). */
export type ApiPagedResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};


export type ApiErrorBody = {
  title?: string;
  message?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
};

// ---------- Каталог ----------

export type ApiProductStatus =
  | "DRAFT"
  | "PENDING_MODERATION"
  | "ACTIVE"
  | "REJECTED"
  | "ARCHIVED";

export type ApiCatalogProductImage = {
  id: string;
  productId: string;
  variantId: string | null;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  isMain: boolean;
};

/** Товар из GET /api/v1/catalog. */
export type ApiCatalogProduct = {
  id: string;
  storeId: string;
  categoryId: string;
  brandId: string;
  name: string;
  slug: string;
  categoryName: string;
  brandName: string;
  status: ApiProductStatus;
  shortDescription: string;
  description: string;
  sku: string;
  price: number;
  stockQuantity: number;
  warrantyMonths: number;
  countryOfOrigin: string;
  createdAt: string;
  images: ApiCatalogProductImage[];
};

// ---------- Категории ----------

/** Узел дерева из GET /api/v1/categories. */
export type ApiCategoryTree = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  level: number;
  children: ApiCategoryTree[];
};