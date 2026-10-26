"use client";

import { formatPrice, pluralize } from "../../lib/format";
import styles from "./CartSummary.module.css";
import Icon from "../common/Icon";

type CartSummaryProps = {
  totalCount: number;
  totalPrice: number;
  totalOldPrice: number;
  onCheckout: () => void;
};

const perks = [
  { icon: "/icons/delivery.svg", text: "Доставка по всій Україні" },
  { icon: "/icons/return.svg", text: "14 днів на повернення товару" },
  { icon: "/icons/warranty.svg", text: "Офіційна гарантія від продавця" },
];

// Підсумок замовлення (права колонка). Точну суму рахує бекенд під час оформлення.
export default function CartSummary({
  totalCount,
  totalPrice,
  totalOldPrice,
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
          <dd>При оформленні</dd>
        </div>
      </dl>

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Вартість товарів</span>
        <span className={styles.totalValue}>
          {formatPrice(totalPrice)}
          <span className={styles.currency}>₴</span>
        </span>
      </div>

      {bonus > 0 && <p className={styles.bonus}>+ {bonus} бонусних ₴ на рахунок після покупки</p>}

      <button type="button" className={styles.checkout} onClick={onCheckout}>
        Оформити замовлення
      </button>

      <p className={styles.terms}>
        Натискаючи кнопку, ви погоджуєтеся з умовами використання та політикою
        конфіденційності TREBA
      </p>

      <ul className={styles.perks}>
        {perks.map((perk) => (
          <li key={perk.text} className={styles.perk}>
            <Icon src={perk.icon} alt="" className={styles.perkIcon} />
            {perk.text}
          </li>
        ))}
      </ul>
    </aside>
  );
}
