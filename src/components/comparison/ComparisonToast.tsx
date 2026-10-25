"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useComparison } from "../../context/ComparisonContext";
import { pluralize } from "../../lib/format";
import Icon from "../common/Icon";
import styles from "./ComparisonToast.module.css";

type ComparisonToastProps = {
  /** Список, у який щойно додали товар; null — тост схований */
  listId: string | null;
  productTitle: string;
  productImage?: string;
  onClose: () => void;
};

const TOAST_DURATION = 6000;
const PRODUCT_FORMS: [string, string, string] = ["товар", "товари", "товарів"];

// Сповіщення «Додано до порівняння». Якщо в списку вже 2+ товари — одразу «Порівняти»,
// якщо один — підказка додати ще товар цієї категорії.
export default function ComparisonToast({
  listId,
  productTitle,
  productImage,
  onClose,
}: ComparisonToastProps) {
  const { getList } = useComparison();
  const list = listId ? getList(listId) : undefined;

  useEffect(() => {
    if (!listId) return;
    const timer = setTimeout(onClose, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [listId, onClose]);

  if (!list) return null;

  const count = list.items.length;
  const canCompare = count >= 2;

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <div className={styles.imageWrap}>
        {productImage ? (
          <Image src={productImage} alt="" width={56} height={56} className={styles.image} />
        ) : (
          <Icon src="/icons/catalog.svg" alt="" className={styles.placeholder} />
        )}
      </div>

      <div className={styles.body}>
        <p className={styles.heading}>
          <span className={styles.check} aria-hidden="true">✓</span>
          Додано до порівняння
        </p>
        <p className={styles.title}>{productTitle}</p>
        <p className={styles.meta}>
          «{list.title}» · {count} {pluralize(count, PRODUCT_FORMS)}
        </p>

        {canCompare ? (
          <Link href={`/comparison/${list.id}`} className={styles.link} onClick={onClose}>
            Порівняти
          </Link>
        ) : (
          <p className={styles.hint}>Додайте ще один товар цієї категорії, щоб порівняти</p>
        )}
      </div>

      <button type="button" className={styles.close} onClick={onClose} aria-label="Закрити">
        ×
      </button>
    </div>
  );
}