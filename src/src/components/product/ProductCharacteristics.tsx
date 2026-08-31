"use client";

import { useState } from "react";
import styles from "./ProductCharacteristics.module.css";
import { ProductCharacteristic } from "../../types/product";

type ProductCharacteristicsProps = {
  characteristics: ProductCharacteristic[];
};

const COLLAPSED_LIMIT = 5;

export default function ProductCharacteristics({ characteristics }: ProductCharacteristicsProps) {
  const [expanded, setExpanded] = useState(false);

  if (characteristics.length === 0) return null;

  const visible = expanded ? characteristics : characteristics.slice(0, COLLAPSED_LIMIT);
  const hasMore = characteristics.length > COLLAPSED_LIMIT;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Характеристики</h2>

      <dl className={styles.list}>
        {visible.map((item) => (
          <div key={item.label} className={styles.row}>
            <dt className={styles.label}>{item.label}</dt>
            <dd className={styles.value}>{item.value}</dd>
          </div>
        ))}
      </dl>

      {hasMore && !expanded && (
        <button type="button" className={styles.showMore} onClick={() => setExpanded(true)}>
          Показати ще
        </button>
      )}
    </section>
  );
}