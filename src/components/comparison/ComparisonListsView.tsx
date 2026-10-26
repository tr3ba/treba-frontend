"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import PageTitle from "../account/PageTitle";
import EmptyState from "../account/EmptyState";
import { useComparison } from "../../context/ComparisonContext";
import { pluralize } from "../../lib/format";
import type { ComparisonCardProduct } from "../../types/comparison";
import ComparisonListCard from "./ComparisonListCard";
import styles from "./ComparisonListsView.module.css";

type ComparisonListsViewProps = {
  /** Товари каталогу, серед яких шукаємо ті, що в списках */
  products: ComparisonCardProduct[];
};

const LIST_FORMS: [string, string, string] = ["список", "списки", "списків"];

// Сторінка «Списки порівнянь» у кабінеті: по одній картці на категорію
export default function ComparisonListsView({ products }: ComparisonListsViewProps) {
  const router = useRouter();
  const { lists, isReady } = useComparison();

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  if (!isReady) {
    return (
      <div className={styles.view}>
        <PageTitle>Списки порівнянь</PageTitle>
        <p className={styles.loading}>Завантажуємо списки…</p>
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <div className={styles.view}>
        <PageTitle>Списки порівнянь</PageTitle>
        <EmptyState
          icon="/icons/libra.svg"
          title="Списків порівнянь поки немає"
          subtitle="Натискайте на терези на сторінці товару — товари однієї категорії зберуться в окремий список"
          actionLabel="Перейти до покупок"
          onAction={() => router.push("/")}
        />
      </div>
    );
  }

  return (
    <div className={styles.view}>
      <div className={styles.titleBlock}>
        <PageTitle>Списки порівнянь</PageTitle>
        <p className={styles.count}>
          {lists.length} {pluralize(lists.length, LIST_FORMS)}
        </p>
      </div>

      <div className={styles.lists}>
        {lists.map((list) => (
          <ComparisonListCard key={list.id} list={list} productsById={productsById} />
        ))}
      </div>
    </div>
  );
}