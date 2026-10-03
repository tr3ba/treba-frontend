import styles from "./ProductReviews.module.css";
import { Review } from "../../types/review";

type ProductReviewsProps = {
  reviews: Review[];
};

export default function ProductReviews({ reviews }: ProductReviewsProps) {
  return (
    <section id="reviews" className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Відгуки покупців <span className={styles.count}>{reviews.length}</span>
        </h2>
        <button type="button" className={styles.writeButton}>
          Написати відгук
        </button>
      </div>

      {reviews.length === 0 ? (
        <p className={styles.empty}>Поки що немає відгуків на цей товар.</p>
      ) : (
        <div className={styles.list}>
          {reviews.map((review) => (
            <article key={review.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.author}>{review.author}</span>
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

              <p className={styles.text}>{review.text}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}