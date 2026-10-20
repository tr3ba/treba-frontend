import Link from "next/link";
import type { SellerProductsSort } from "../../types/seller";
import { sellerProductsHref } from "../../lib/sellerLinks";
import styles from "./SellerPagination.module.css";

type SellerPaginationProps = {
  sellerId: string;
  category?: string;
  sort: SellerProductsSort;
  page: number;
  totalPages: number;
};

/** Номера страниц с многоточиями: 1 … 4 5 6 … 12 */
function pageList(page: number, totalPages: number): (number | "gap")[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const result: (number | "gap")[] = [];
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) result.push("gap");
    result.push(p);
  });
  return result;
}

export default function SellerPagination({
  sellerId,
  category,
  sort,
  page,
  totalPages,
}: SellerPaginationProps) {
  if (totalPages <= 1) return null;

  // #seller-products — после перехода прокручиваем к началу списка, а не к шапке
  const href = (target: number) => `${sellerProductsHref(sellerId, { category, sort, page: target })}#seller-products`;

  return (
    <nav className={styles.pagination} aria-label="Сторінки товарів">
      {page > 1 ? (
        <Link href={href(page - 1)} className={styles.arrow} aria-label="Попередня сторінка">
          ‹
        </Link>
      ) : (
        <span className={`${styles.arrow} ${styles.disabled}`} aria-hidden="true">
          ‹
        </span>
      )}

      {pageList(page, totalPages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className={styles.gap}>
            …
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            className={`${styles.page} ${item === page ? styles.pageActive : ""}`}
            aria-current={item === page ? "page" : undefined}
          >
            {item}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link href={href(page + 1)} className={styles.arrow} aria-label="Наступна сторінка">
          ›
        </Link>
      ) : (
        <span className={`${styles.arrow} ${styles.disabled}`} aria-hidden="true">
          ›
        </span>
      )}
    </nav>
  );
}