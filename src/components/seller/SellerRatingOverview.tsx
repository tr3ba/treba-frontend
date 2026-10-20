"use client";

import { useState } from "react";
import RatingStars from "./RatingStars";
import type { SellerRating, SellerRatingCriterion, SellerRatingPeriod } from "../../types/seller";
import { pluralize } from "../../lib/format";
import styles from "./SellerRatingOverview.module.css";

type SellerRatingOverviewProps = {
  rating: SellerRating;
};

const PERIODS: { value: SellerRatingPeriod; label: string; suffix: string }[] = [
  { value: "30d", label: "30 днів", suffix: "за 30 днів" },
  { value: "6m", label: "6 місяців", suffix: "за 6 місяців" },
  { value: "all", label: "Весь час", suffix: "за весь час" },
];

const CRITERIA: { value: SellerRatingCriterion; label: string }[] = [
  { value: "service", label: "Якість обслуговування" },
  { value: "delivery", label: "Дотримання термінів доставки" },
  { value: "accuracy", label: "Актуальність ціни та наявності" },
];

const STARS = [5, 4, 3, 2, 1] as const;

// Рейтинг продавца с переключателем периода: итог, распределение оценок, критерии
export default function SellerRatingOverview({ rating }: SellerRatingOverviewProps) {
  const [period, setPeriod] = useState<SellerRatingPeriod>("all");

  const current = rating.byPeriod[period];
  const periodInfo = PERIODS.find((item) => item.value === period) ?? PERIODS[2];
  // Самая длинная полоска = самая частая оценка (иначе при 361 из 412 остальные не видны)
  const maxCount = Math.max(1, ...STARS.map((star) => current.distribution[star]));

  return (
    <section className={styles.card} aria-labelledby="seller-rating-title">
      <div className={styles.header}>
        <h2 id="seller-rating-title" className={styles.title}>
          Рейтинг продавця
        </h2>

        <div className={styles.periods} role="radiogroup" aria-label="Період">
          {PERIODS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={period === item.value}
              className={`${styles.period} ${period === item.value ? styles.periodActive : ""}`}
              onClick={() => setPeriod(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.total}>
          <div className={styles.average}>
            <span className={styles.averageValue}>{current.average.toFixed(1)}</span>
            <span className={styles.averageMax}>/5</span>
          </div>
          <RatingStars value={current.average} size="lg" />
          <p className={styles.totalCount}>
            {current.count} {pluralize(current.count, ["оцінка", "оцінки", "оцінок"])} {periodInfo.suffix}
          </p>
        </div>

        <ul className={styles.distribution} aria-label="Розподіл оцінок">
          {STARS.map((star) => {
            const count = current.distribution[star];
            return (
              <li key={star} className={styles.row}>
                <span className={styles.rowStar}>
                  {star} <span aria-hidden="true">★</span>
                </span>
                <span className={styles.bar}>
                  <span className={styles.barFill} style={{ width: `${(count / maxCount) * 100}%` }} />
                </span>
                <span className={styles.rowCount}>{count}</span>
              </li>
            );
          })}
        </ul>

        <div className={styles.criteria}>
          <h3 className={styles.criteriaTitle}>Оцінки за критеріями</h3>
          <ul className={styles.criteriaList}>
            {CRITERIA.map((criterion) => {
              const value = rating.criteria[criterion.value][period];
              return (
                <li key={criterion.value} className={styles.criterion}>
                  <div className={styles.criterionHead}>
                    <span className={styles.criterionLabel}>{criterion.label}</span>
                    <span className={styles.criterionValue}>
                      <span className={styles.criterionStar} aria-hidden="true">
                        ★
                      </span>
                      {value.toFixed(1)}
                    </span>
                  </div>
                  <span className={styles.bar}>
                    <span className={styles.barFill} style={{ width: `${(value / 5) * 100}%` }} />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <details className={styles.howTo}>
        <summary className={styles.howToSummary}>Як розраховується рейтинг?</summary>
        <p className={styles.howToText}>
          Оцінки ставлять лише покупці, які отримали замовлення від цього продавця. Кожен відгук
          містить три оцінки: якість обслуговування, дотримання термінів доставки та актуальність
          ціни й наявності. Загальний рейтинг — середнє значення всіх оцінок за обраний період.
        </p>
      </details>
    </section>
  );
}