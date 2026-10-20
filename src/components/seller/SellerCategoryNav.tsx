import Link from "next/link";
import type { SellerCategoryCount, SellerProductsSort } from "../../types/seller";
import { sellerProductsHref } from "../../lib/sellerLinks";
import styles from "./SellerCategoryNav.module.css";

type SellerCategoryNavProps = {
  sellerId: string;
  categories: SellerCategoryCount[];
  totalAll: number;
  activeCategory?: string;
  sort: SellerProductsSort;
};

// Десктоп — список слева, ≤900px — горизонтальные чипсы над товарами
export default function SellerCategoryNav({
  sellerId,
  categories,
  totalAll,
  activeCategory,
  sort,
}: SellerCategoryNavProps) {
  const items = [
    { id: undefined, label: "Усі товари", count: totalAll },
    ...categories.map((category) => ({
      id: category.categoryId,
      label: category.label,
      count: category.count,
    })),
  ];

  return (
    <nav className={styles.nav} aria-label="Категорії товарів продавця">
      <h2 className={styles.title}>Категорії</h2>

      <ul className={styles.list}>
        {items.map((item) => {
          const isActive = item.id === activeCategory;
          return (
            <li key={item.id ?? "all"}>
              <Link
                href={sellerProductsHref(sellerId, { category: item.id, sort })}
                className={`${styles.item} ${isActive ? styles.itemActive : ""}`}
                aria-current={isActive ? "page" : undefined}
                scroll={false}
              >
                <span className={styles.label}>{item.label}</span>
                <span className={styles.count}>{item.count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}