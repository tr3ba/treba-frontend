"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SellerReviewsSort as SortValue } from "../../types/seller";
import { SELLER_REVIEWS_SORT_OPTIONS, parseReviewsSort, sellerReviewsHref } from "../../lib/sellerLinks";
// Вид такой же, как у сортировки товаров — берём её стили
import styles from "./SellerSortSelect.module.css";

type SellerReviewsSortProps = {
  sellerId: string;
  value: SortValue;
};

export default function SellerReviewsSort({ sellerId, value }: SellerReviewsSortProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const sort = parseReviewsSort(event.target.value);
    startTransition(() => {
      router.push(sellerReviewsHref(sellerId, sort), { scroll: false });
    });
  }

  return (
    <label className={`${styles.wrapper} ${isPending ? styles.pending : ""}`}>
      <span className={styles.label}>Сортування:</span>
      <select className={styles.select} value={value} onChange={handleChange} disabled={isPending}>
        {SELLER_REVIEWS_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}