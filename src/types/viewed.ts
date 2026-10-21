import type { Product } from "./product";

/** Товар в истории просмотров — только то, что нужно карточке. */
export type ViewedProduct = Pick<
  Product,
  "id" | "backendId" | "title" | "price" | "oldPrice" | "image" | "rating" | "isPromo"
> & {
  /** ISO-дата последнего просмотра */
  viewedAt: string;
};