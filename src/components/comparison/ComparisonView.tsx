"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import EmptyState from "../account/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useComparison } from "../../context/ComparisonContext";
import { MAX_COMPARISON_ITEMS } from "../../lib/api/comparisons";
import { buildComparisonRows, getCheapestProductId } from "../../lib/comparisonRows";
import { pluralize } from "../../lib/format";
import { buildAuthHref } from "../../lib/redirect";
import type { ComparisonCardProduct } from "../../types/comparison";
import ComparisonTable from "./ComparisonTable";
import styles from "./ComparisonView.module.css";

type ComparisonViewProps = {
  listId: string;
  /** Товари каталогу, серед яких шукаємо товари списку */
  products: ComparisonCardProduct[];
};

const PRODUCT_FORMS: [string, string, string] = ["товар", "товари", "товарів"];
const LISTS_HREF = "/account/comparisons";

/** «Геймерські крісла» -> «геймерські крісла» для заголовка «Порівнюємо …» */
function lowerFirst(text: string): string {
  return text.charAt(0).toLocaleLowerCase("uk") + text.slice(1);
}

// Сторінка порівняння одного списку: заголовок, панель дій, таблиця
export default function ComparisonView({ listId, products }: ComparisonViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const { isReady, getList } = useComparison();
  const [onlyDifferences, setOnlyDifferences] = useState(false);

  const list = getList(listId);

  // Товари списку в порядку додавання; яких немає в каталозі — пропускаємо
  const listed = useMemo(() => {
    if (!list) return [];
    const byId = new Map(products.map((product) => [product.id, product]));
    return list.items
      .map((item) => byId.get(item.productKey))
      .filter((product): product is ComparisonCardProduct => product !== undefined);
  }, [list, products]);

  const rows = useMemo(() => buildComparisonRows(listed), [listed]);

  // ---------- стани без таблиці ----------

  if (isLoading || (user && !isReady)) {
    return (
      <main className={styles.page}>
        <p className={styles.loading}>Завантажуємо порівняння…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.page}>
        <EmptyState
          icon="/icons/libra.svg"
          title="Увійдіть, щоб порівнювати товари"
          subtitle="Списки порівнянь зберігаються в особистому кабінеті"
          actionLabel="Увійти"
          onAction={() => router.push(buildAuthHref("/login", pathname))}
        />
      </main>
    );
  }

  if (!list) {
    return (
      <main className={styles.page}>
        <EmptyState
          icon="/icons/libra.svg"
          title="Цього списку порівняння немає"
          subtitle="Можливо, його вже видалили або з нього прибрали всі товари"
          actionLabel="До списків порівнянь"
          onAction={() => router.push(LISTS_HREF)}
        />
      </main>
    );
  }

  // ---------- таблиця ----------

  const count = list.items.length;
  const missingCount = count - listed.length;
  const canAddMore = count < MAX_COMPARISON_ITEMS;
  const catalogHref = list.catalogCategoryId ? `/catalog/${list.catalogCategoryId}` : "/";
  const differentCount = rows.filter((row) => !row.isSame).length;
  const pricesDiffer = getCheapestProductId(listed) !== null;

  // Підказка біля перемикача: що саме відрізняється
  let legend = "Однакові значення показані сірим";
  if (differentCount === 0) {
    legend = pricesDiffer
      ? "Характеристики збігаються — різниця в ціні"
      : "Характеристики й ціни в цих товарів однакові";
  }

  return (
    <main className={styles.page}>
      <Link href={LISTS_HREF} className={styles.back}>
        <span aria-hidden="true">←</span> Списки порівнянь
      </Link>

      <div className={styles.titleBlock}>
        <h1 className={styles.title}>Порівнюємо {lowerFirst(list.title)}</h1>
        <p className={styles.count}>
          {count} {pluralize(count, PRODUCT_FORMS)}
        </p>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.switch}>
          <input
            type="checkbox"
            className={styles.switchInput}
            checked={onlyDifferences}
            onChange={(event) => setOnlyDifferences(event.target.checked)}
            disabled={listed.length < 2}
          />
          <span className={styles.switchTrack} aria-hidden="true">
            <span className={styles.switchThumb} />
          </span>
          <span className={styles.switchLabel}>Тільки відмінності</span>
        </label>

        {listed.length >= 2 && <p className={styles.legend}>{legend}</p>}

        {canAddMore && (
          <Link href={catalogHref} className={styles.addLink}>
            <span className={styles.addIcon} aria-hidden="true">+</span>
            Додати ще модель
          </Link>
        )}
      </div>

      {listed.length === 1 && (
        <p className={styles.notice}>
          У списку один товар. Додайте ще хоча б один товар цієї категорії, щоб побачити різницю.
        </p>
      )}

      {missingCount > 0 && (
        <p className={styles.notice}>
          Ще {missingCount} {pluralize(missingCount, PRODUCT_FORMS)} зі списку зараз недоступні в
          каталозі.
        </p>
      )}

      {listed.length > 0 && (
        <ComparisonTable products={listed} rows={rows} onlyDifferences={onlyDifferences} />
      )}
    </main>
  );
}