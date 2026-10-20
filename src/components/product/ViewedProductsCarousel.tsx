"use client";

import ProductCarousel from "./ProductCarousel";
import { useViewedProducts } from "../../lib/useViewedProducts";

type ViewedProductsCarouselProps = {
  /** Не показывать этот товар (текущая страница товара) */
  excludeId?: string;
  limit?: number;
};

// Карусель «Переглянуті товари» из истории браузера; пустая история — блока нет
export default function ViewedProductsCarousel({ excludeId, limit = 10 }: ViewedProductsCarouselProps) {
  const viewed = useViewedProducts();
  const products = viewed.filter((product) => product.id !== excludeId).slice(0, limit);

  return <ProductCarousel title="Переглянуті товари" products={products} />;
}