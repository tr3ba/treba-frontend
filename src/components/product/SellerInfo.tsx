import Image from "next/image";
import Link from "next/link";
import styles from "./SellerInfo.module.css";
import type { Seller } from "../../types/product";
import { pluralize } from "../../lib/format";
import { sellerProductsHref, sellerReviewsHref } from "../../lib/sellerLinks";

type SellerInfoProps = {
  seller: Seller;
};

// Первые буквы названия — когда у магазина нет логотипа (как в шапке страницы продавца)
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

// Блок «Продавець» на странице товара: название, рейтинг, ссылки на страницу продавца
export default function SellerInfo({ seller }: SellerInfoProps) {
  const productsHref = sellerProductsHref(seller.id);
  const hasRating = seller.rating !== undefined && (seller.ratingCount ?? 0) > 0;

  return (
    <section className={styles.wrapper} aria-label="Продавець">
      <Link href={productsHref} className={styles.head}>
        <span className={styles.logoWrap}>
          {seller.logo ? (
            <Image src={seller.logo} alt="" width={36} height={36} className={styles.logo} />
          ) : (
            <span className={styles.initials} aria-hidden="true">
              {initials(seller.name)}
            </span>
          )}
        </span>

        <span className={styles.textBlock}>
          <span className={styles.label}>Продавець</span>
          <span className={styles.name}>{seller.name}</span>
        </span>

        <span className={styles.arrow} aria-hidden="true">
          ›
        </span>
      </Link>

      {hasRating && seller.rating !== undefined && (
        <p className={styles.rating}>
          <span className={styles.star} aria-hidden="true">
            ★
          </span>
          <span className={styles.ratingValue}>{seller.rating.toFixed(1)}</span>
          <span className={styles.ratingCount}>
            · {seller.ratingCount} {pluralize(seller.ratingCount ?? 0, ["оцінка", "оцінки", "оцінок"])}
          </span>
        </p>
      )}

      <div className={styles.links}>
        <Link href={productsHref} className={styles.link}>
          Усі товари продавця
        </Link>
        {hasRating && (
          <Link href={sellerReviewsHref(seller.id)} className={styles.link}>
            Відгуки
          </Link>
        )}
      </div>
    </section>
  );
}