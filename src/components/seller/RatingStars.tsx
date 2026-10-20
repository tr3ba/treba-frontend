import styles from "./RatingStars.module.css";

type RatingStarsProps = {
  /** Оценка от 0 до 5, можно дробную (4.8 — закрашено 96%). */
  value: number;
  size?: "sm" | "md" | "lg";
};

// Пять звёзд с частичной заливкой: серый ряд + жёлтый ряд поверх, обрезанный по ширине
export default function RatingStars({ value, size = "md" }: RatingStarsProps) {
  const percent = Math.min(100, Math.max(0, (value / 5) * 100));

  return (
    <span
      className={`${styles.stars} ${styles[size]}`}
      role="img"
      aria-label={`Рейтинг ${value.toFixed(1)} з 5`}
    >
      <span className={styles.empty} aria-hidden="true">
        ★★★★★
      </span>
      <span className={styles.filled} style={{ width: `${percent}%` }} aria-hidden="true">
        ★★★★★
      </span>
    </span>
  );
}