// Отзывы о товаре. Бэк: GET /api/v1/reviews/products/{guid} (публичный, только опубликованные).
import type {
  ApiReview,
  ApiReviewsPage,
  Review,
  ReviewableProduct,
  ReviewsPage,
} from "../../types/review";
import { formatDate } from "../format";
import { apiFetch } from "./client";

const PAGE_SIZE = 20;
// Имени автора бэк пока не отдаёт (только userId) — подписываем нейтрально
const DEFAULT_AUTHOR = "Покупець TREBA";

const EMPTY_PAGE: ReviewsPage = { items: [], total: 0 };

function mapReview(dto: ApiReview): Review {
  return {
    id: dto.id,
    author: DEFAULT_AUTHOR,
    date: formatDate(dto.createdAt),
    rating: dto.rating,
    title: dto.title || undefined,
    text: dto.comment,
    verifiedPurchase: dto.verifiedPurchase,
  };
}

/**
 * Первые отзывы о товаре. productBackendId — Guid товара (Product.backendId).
 * Отзывы — второстепенный блок: при ошибке страница товара всё равно открывается.
 */
export async function getProductReviews(productBackendId: string | undefined): Promise<ReviewsPage> {
  if (!productBackendId) return EMPTY_PAGE;

  try {
    const page = await apiFetch<ApiReviewsPage>(
      `/api/v1/reviews/products/${encodeURIComponent(productBackendId)}`,
      { query: { page: 1, pageSize: PAGE_SIZE } }
    );
    return { items: page.items.map(mapReview), total: page.totalCount };
  } catch (error) {
    console.error("Не вдалося завантажити відгуки:", error);
    return EMPTY_PAGE;
  }
}

/**
 * Купленные товары без отзыва — для кабинета («Чекають відгуків»).
 * Эндпоинта на бэке пока нет -> пустой список; страница уже готова к данным.
 */
export async function getProductsAwaitingReview(): Promise<ReviewableProduct[]> {
  return [];
}