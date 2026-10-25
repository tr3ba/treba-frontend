"use client";

import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "../cart/AddToCartButton";
import { useComparison } from "../../context/ComparisonContext";
import type { ComparisonCardProduct } from "../../types/comparison";
import Icon from "../common/Icon";
import styles from "./ComparisonProductHead.module.css";

type ComparisonProductHeadProps = {
  product: ComparisonCardProduct;
  /** Найнижча ціна серед товарів списку */
  isCheapest: boolean;
};

// Компактна картка товару у верхньому рядку таблиці порівняння
export default function ComparisonProductHead({ product, isCheapest }: ComparisonProductHeadProps) {
  const { remove } = useComparison();
  const href = `/product/${product.id}`;
  const inStock = product.inStock !== false;

  return (
    <div className={styles.card}>
      <button
        type="button"
        className={styles.remove}
        onClick={() => void remove(product.id)}
        aria-label={`Прибрати з порівняння: ${product.title}`}
        title="Прибрати з порівняння"
      >
        ×
      </button>

      {isCheapest && <span className={styles.badge}>Найнижча ціна</span>}

      <Link href={href} className={styles.imageLink} tabIndex={-1} aria-hidden="true">
        {product.image ? (
          <Image src={product.image} alt="" width={140} height={140} className={styles.image} />
        ) : (
          <Icon src="/icons/catalog.svg" alt="" className={styles.placeholder} />
        )}
      </Link>

      <Link href={href} className={styles.title}>
        {product.title}
      </Link>

      <p className={inStock ? styles.inStock : styles.outOfStock}>
        {inStock ? "Є в наявності" : "Немає в наявності"}
      </p>

      <div className={styles.bottom}>
        <div className={styles.prices}>
          {product.isPromo && product.oldPrice && (
            <span className={styles.oldPrice}>{product.oldPrice} ₴</span>
          )}
          <span className={product.isPromo ? styles.pricePromo : styles.price}>
            {product.price} ₴
          </span>
        </div>

        {inStock && (
          <AddToCartButton
            product={{
              id: product.id,
              variantId: product.variantId,
              title: product.title,
              price: product.price,
              image: product.image,
              oldPrice: product.isPromo ? product.oldPrice : null,
            }}
          />
        )}
      </div>
    </div>
  );
}