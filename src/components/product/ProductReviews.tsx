import styles from "./ProductReviews.module.css";
import { Review } from "../../types/review";
import Link from "next/link";
import ReviewReply from "./ReviewReply";

type ProductReviewsProps = {
  reviews: Review[];
  /** Всего отзывов (на странице показываем только первые) */
  total: number;
};

export default function ProductReviews({ reviews, total }: ProductReviewsProps) {
  return (
    <section id="reviews" className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Відгуки покупців <span className={styles.count}>{total}</span>
        </h2>
        <Link href="/account/reviews" className={styles.writeButton}>
          Написати відгук
        </Link>
      </div>

      {reviews.length === 0 ? (
        <p className={styles.empty}>Поки що немає відгуків на цей товар.</p>
      ) : (
        <div className={styles.list}>
          {reviews.map((review) => (
            <article key={review.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.author}>
                  {review.author}
                  {review.verifiedPurchase && (
                    <span className={styles.verified}>✓ Перевірена покупка</span>
                  )}
                </span>
                <span className={styles.date}>{review.date}</span>
              </div>

              <div className={styles.rating} aria-label={`Оцінка ${review.rating} з 5`}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <span
                    key={index}
                    className={`${styles.star} ${index < review.rating ? styles.starFilled : ""}`}
                  >
                    ★
                  </span>
                ))}
              </div>

              {review.title && <h3 className={styles.reviewTitle}>{review.title}</h3>}
              <p className={styles.text}>{review.text}</p>
              <ReviewReply text={review.staffReply} repliedAt={review.staffRepliedAt} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
