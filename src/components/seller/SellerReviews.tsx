import EmptyState from "../account/EmptyState";
import SellerReviewsSort from "./SellerReviewsSort";
import type { SellerRatingCriterion, SellerReview, SellerReviewsSort as SortValue } from "../../types/seller";
import { formatDate, pluralize } from "../../lib/format";
import styles from "./SellerReviews.module.css";

type SellerReviewsProps = {
  sellerId: string;
  sellerName: string;
  reviews: SellerReview[];
  sort: SortValue;
};

const SCORE_LABELS: { value: SellerRatingCriterion; label: string }[] = [
  { value: "service", label: "Обслуговування" },
  { value: "delivery", label: "Терміни доставки" },
  { value: "accuracy", label: "Актуальність" },
];

// Цвет оценки: 4–5 — хорошо, 3 — средне, 1–2 — плохо
function scoreTone(score: number): string {
  if (score >= 4) return styles.scoreGood;
  if (score === 3) return styles.scoreMid;
  return styles.scoreBad;
}

// Вкладка «Відгуки»: список отзывов о продавце с оценками по критериям и ответами
export default function SellerReviews({ sellerId, sellerName, reviews, sort }: SellerReviewsProps) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        icon="/icons/reviews.svg"
        title="Відгуків поки немає"
        subtitle="Тут з’являться відгуки покупців, які отримали замовлення від цього продавця."
      />
    );
  }

  return (
    <section className={styles.section} aria-label="Відгуки про продавця">
      <div className={styles.toolbar}>
        <p className={styles.found}>
          <strong>{reviews.length}</strong> {pluralize(reviews.length, ["відгук", "відгуки", "відгуків"])}{" "}
          про продавця
        </p>
        <SellerReviewsSort sellerId={sellerId} value={sort} />
      </div>

      <ul className={styles.list}>
        {reviews.map((review) => (
          <li key={review.id} className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.author}>{review.author}</span>
              <time className={styles.date} dateTime={review.date}>
                {formatDate(review.date)}
              </time>
            </div>

            <ul className={styles.scores} aria-label="Оцінки">
              {SCORE_LABELS.map((item) => {
                const score = review.scores[item.value];
                return (
                  <li key={item.value} className={styles.score}>
                    {item.label}
                    <span className={`${styles.scoreValue} ${scoreTone(score)}`}>
                      <span aria-hidden="true">★</span> {score}
                    </span>
                  </li>
                );
              })}
            </ul>

            {review.text && <p className={styles.text}>{review.text}</p>}

            {review.reply && (
              <div className={styles.reply}>
                <div className={styles.replyHead}>
                  <span className={styles.replyAuthor}>Відповідь продавця {sellerName}</span>
                  <time className={styles.date} dateTime={review.reply.date}>
                    {formatDate(review.reply.date)}
                  </time>
                </div>
                <p className={styles.replyText}>{review.reply.text}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}