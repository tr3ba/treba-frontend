"use client";

import { useEffect } from "react";
import { addViewedProduct } from "../../lib/api/viewed";

type ViewedProductTrackerProps = {
  id: string;
  backendId?: string;
  title: string;
  price: string;
  oldPrice?: string | null;
  image?: string;
  rating?: number;
  isPromo?: boolean;
};

// Невидимый компонент на странице товара: записывает просмотр в историю
export default function ViewedProductTracker({
  id,
  backendId,
  title,
  price,
  oldPrice,
  image,
  rating,
  isPromo,
}: ViewedProductTrackerProps) {
  useEffect(() => {
    addViewedProduct({ id, backendId, title, price, oldPrice, image, rating, isPromo });
  }, [id, backendId, title, price, oldPrice, image, rating, isPromo]);

  return null;
}