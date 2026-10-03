"use client";

import { useState } from "react";
import styles from "./ProductQuickSpecs.module.css";
import { ProductCharacteristic } from "../../types/product";

type ProductQuickSpecsProps = {
  characteristics: ProductCharacteristic[];
};

const COLLAPSED_LIMIT = 6;

export default function ProductQuickSpecs({ characteristics }: ProductQuickSpecsProps) {
  const [expanded, setExpanded] = useState(false);

  if (characteristics.length === 0) return null;

  const visible = expanded ? characteristics : characteristics.slice(0, COLLAPSED_LIMIT);
  const hasMore = characteristics.length > COLLAPSED_LIMIT;

  return (
    <div className={styles.box}>
      <h2 className={styles.title}>Основні характеристики</h2>

      <ul className={styles.list}>
        {visible.map((item) => (
          <li key={item.label} className={styles.row}>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.dots} aria-hidden="true" />
            <span className={styles.value}>{item.value}</span>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button type="button" className={styles.showMore} onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Згорнути" : "Показати ще"}
        </button>
      )}
    </div>
  );
}