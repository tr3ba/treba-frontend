"use client";

import { formatPrice, pluralize } from "../../lib/format";
import styles from "./CartSummary.module.css";

type CartSummaryProps = {
  totalCount: number;
  totalPrice: number;
  totalOldPrice: number;
  isSubmitting: boolean;
  onCheckout: () => void;
};

const perks = [
  { icon: "/icons/delivery.svg", text: "Безкоштовна доставка першого замовлення" },
  { icon: "/icons/return.svg", text: "14 днів на повернення товару" },
  { icon: "/icons/warranty.svg", text: "Офіційна гарантія від продавця" },
];

// Підсумок замовлення (права колонка)
export default function CartSummary({
  totalCount,
  totalPrice,
  totalOldPrice,
  isSubmitting,
  onCheckout,
}: CartSummaryProps) {
  const discount = Math.max(0, totalOldPrice - totalPrice);
  const bonus = Math.round(totalPrice * 0.02);

  return (
    <aside className={styles.summary}>
      <h2 className={styles.heading}>Разом</h2>

      <dl className={styles.rows}>
        <div className={styles.row}>
          <dt>
            {totalCount} {pluralize(totalCount, ["товар", "товари", "товарів"])} на суму
          </dt>
          <dd>{formatPrice(totalOldPrice)} ₴</dd>
        </div>

        {discount > 0 && (
          <div className={styles.row}>
            <dt>Знижка</dt>
            <dd className={styles.discount}>−{formatPrice(discount)} ₴</dd>
          </div>
        )}

        <div className={styles.row}>
          <dt>Доставка</dt>
          <dd className={styles.free}>Безкоштовно</dd>
        </div>
      </dl>

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>До сплати</span>
        <span className={styles.totalValue}>
          {formatPrice(totalPrice)}
          <span className={styles.currency}>₴</span>
        </span>
      </div>

      {bonus > 0 && <p className={styles.bonus}>+ {bonus} бонусних ₴ на рахунок після покупки</p>}

      <button
        type="button"
        className={styles.checkout}
        onClick={onCheckout}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Оформлюємо…" : "Оформити замовлення"}
      </button>

      <p className={styles.terms}>
        Натискаючи кнопку, ви погоджуєтеся з умовами використання та політикою
        конфіденційності TREBA
      </p>

      <ul className={styles.perks}>
        {perks.map((perk) => (
          <li key={perk.text} className={styles.perk}>
            <img src={perk.icon} alt="" className={styles.perkIcon} />
            {perk.text}
          </li>
        ))}
      </ul>
    </aside>
  );
}