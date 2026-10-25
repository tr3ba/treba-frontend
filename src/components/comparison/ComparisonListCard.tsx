"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useComparison } from "../../context/ComparisonContext";
import { MAX_COMPARISON_ITEMS } from "../../lib/api/comparisons";
import { pluralize } from "../../lib/format";
import type { ComparisonCardProduct, ComparisonList } from "../../types/comparison";
import Icon from "../common/Icon";
import styles from "./ComparisonListCard.module.css";

type ComparisonListCardProps = {
  list: ComparisonList;
  productsById: Map<string, ComparisonCardProduct>;
};

const PRODUCT_FORMS: [string, string, string] = ["товар", "товари", "товарів"];

// Картка одного списку: назва категорії, кількість, мініатюри товарів, дії.
// Видалення — з підтвердженням прямо в картці, без модалки.
export default function ComparisonListCard({ list, productsById }: ComparisonListCardProps) {
  const { removeList } = useComparison();
  const [confirming, setConfirming] = useState(false);

  const count = list.items.length;
  const canCompare = count >= 2;
  const canAddMore = count < MAX_COMPARISON_ITEMS;
  const compareHref = `/comparison/${list.id}`;
  const catalogHref = list.catalogCategoryId ? `/catalog/${list.catalogCategoryId}` : "/";

  return (
    <article className={styles.card}>
      <div className={styles.head}>
        <div className={styles.info}>
          <h2 className={styles.title}>
            {canCompare ? (
              <Link href={compareHref} className={styles.titleLink}>
                {list.title}
              </Link>
            ) : (
              list.title
            )}
          </h2>
          <p className={styles.count}>
            {count} {pluralize(count, PRODUCT_FORMS)}
            {!canCompare && (
              <span className={styles.hint}> · додайте ще один товар, щоб порівняти</span>
            )}
          </p>
        </div>

        {confirming ? (
          <div className={styles.confirm} role="group" aria-label="Підтвердження видалення">
            <span className={styles.confirmText}>Видалити список?</span>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() => void removeList(list.id)}
            >
              Видалити
            </button>
            <button
              type="button"
              className={styles.ghostButton}
              onClick={() => setConfirming(false)}
            >
              Скасувати
            </button>
          </div>
        ) : (
          <div className={styles.actions}>
            {canCompare ? (
              <Link href={compareHref} className={styles.primaryButton}>
                Порівняти
              </Link>
            ) : (
              <Link href={catalogHref} className={styles.secondaryButton}>
                Додати товар
              </Link>
            )}
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setConfirming(true)}
              aria-label={`Видалити список «${list.title}»`}
              title="Видалити список"
            >
              <svg viewBox="0 0 24 24" className={styles.trash} aria-hidden="true">
                <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <ul className={styles.thumbs}>
        {list.items.map((item) => {
          const product = productsById.get(item.productKey);
          return (
            <li key={item.productKey}>
              <Link
                href={`/product/${item.productKey}`}
                className={styles.thumb}
                title={product?.title ?? "Товар"}
              >
                {product?.image ? (
                  <Image
                    src={product.image}
                    alt={product.title}
                    width={72}
                    height={72}
                    className={styles.thumbImage}
                  />
                ) : (
                  <Icon src="/icons/catalog.svg" alt="" className={styles.placeholder} />
                )}
              </Link>
            </li>
          );
        })}

        {canAddMore && (
          <li>
            <Link href={catalogHref} className={styles.addTile} aria-label="Додати ще товар">
              <span className={styles.plus} aria-hidden="true">+</span>
            </Link>
          </li>
        )}
      </ul>
    </article>
  );
}