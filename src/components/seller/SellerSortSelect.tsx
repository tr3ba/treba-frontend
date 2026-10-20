"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SellerProductsSort } from "../../types/seller";
import { SELLER_SORT_OPTIONS, parseSellerSort, sellerProductsHref } from "../../lib/sellerLinks";
import styles from "./SellerSortSelect.module.css";

type SellerSortSelectProps = {
  sellerId: string;
  category?: string;
  value: SellerProductsSort;
};

// Смена сортировки = новый адрес; страница сбрасывается на первую
export default function SellerSortSelect({ sellerId, category, value }: SellerSortSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const sort = parseSellerSort(event.target.value);
    startTransition(() => {
      router.push(sellerProductsHref(sellerId, { category, sort }), { scroll: false });
    });
  }

  return (
    <label className={`${styles.wrapper} ${isPending ? styles.pending : ""}`}>
      <span className={styles.label}>Сортування:</span>
      <select className={styles.select} value={value} onChange={handleChange} disabled={isPending}>
        {SELLER_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}