export type Review = {
  id: string;
  author: string;
  date: string;
  rating: number;
  /** Заголовок отзыва (может быть пустым) */
  title?: string;
  text: string;
  /** Отзыв от покупателя, который купил товар на TREBA */
  verifiedPurchase?: boolean;
  photos?: string[];
};

/** Страница отзывов о товаре: первые отзывы + общее количество. */
export type ReviewsPage = {
  items: Review[];
  total: number;
};

export type ReviewsSummary = {
  average: number;
  count: number;
  // Кількість відгуків на кожну оцінку
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  aiSummary?: {
    recommendPercent: number;
    text: string;
  };
};

// ---------- DTO бэка: GET /api/v1/reviews/products/{productId} ----------

export type ApiReview = {
  id: string;
  productId: string;
  userId: string;
  orderItemId: string;
  rating: number;
  title: string;
  comment: string;
  /** Бэк отдаёт только опубликованные — для UI не нужен */
  status: string | number;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ApiReviewsPage = {
  items: ApiReview[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};