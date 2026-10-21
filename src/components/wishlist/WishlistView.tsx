"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "../home/ProductCard";
import PageTitle from "../account/PageTitle";
import EmptyState from "../account/EmptyState";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { getWishlistKey } from "../../lib/api/wishlist";
import { formatPrice, parsePrice, pluralize } from "../../lib/format";
import type { WishlistCardProduct } from "../../types/wishlist";
import styles from "./WishlistView.module.css";

type WishlistViewProps = {
  /** Товары каталога, среди которых ищем те, что в списке */
  products: WishlistCardProduct[];
};

const PRODUCT_FORMS: [string, string, string] = ["товар", "товари", "товарів"];

// Сторінка «Список бажань»: сітка товарів, сума, «Купити все»
export default function WishlistView({ products }: WishlistViewProps) {
  const router = useRouter();
  const { items, isReady } = useWishlist();
  const { addItem, isInCart } = useCart();

  const productsByKey = useMemo(
    () => new Map(products.map((product) => [getWishlistKey(product), product])),
    [products]
  );

  // В порядке списка (новые сверху); товары, которых нет в каталоге, пропускаем
  const listed = useMemo(
    () =>
      items
        .map((item) => productsByKey.get(item.productKey))
        .filter((product): product is WishlistCardProduct => product !== undefined),
    [items, productsByKey]
  );

  const unavailableCount = items.length - listed.length;
  const total = listed.reduce((sum, product) => sum + parsePrice(product.price), 0);

  function handleBuyAll() {
    for (const product of listed) {
      if (isInCart(product.id)) continue;
      addItem(
        {
          id: product.id,
          variantId: product.variantId,
          title: product.title,
          price: product.price,
          image: product.image,
          oldPrice: product.isPromo ? product.oldPrice ?? null : null,
        },
        { silent: true }
      );
    }
    router.push("/cart");
  }

  if (!isReady) {
    return (
      <div className={styles.view}>
        <PageTitle>Список бажань</PageTitle>
        <p className={styles.loading}>Завантажуємо список…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.view}>
        <PageTitle>Список бажань</PageTitle>
        <EmptyState
          icon="/icons/heart.svg"
          title="Список бажань порожній"
          subtitle="Натискайте на сердечко біля товару, щоб зберегти його тут"
          actionLabel="Перейти до покупок"
          onAction={() => router.push("/")}
        />
      </div>
    );
  }

  return (
    <div className={styles.view}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <PageTitle>Список бажань</PageTitle>
          <p className={styles.count}>
            {items.length} {pluralize(items.length, PRODUCT_FORMS)}
          </p>
        </div>

        {listed.length > 0 && (
          <div className={styles.summary}>
            <p className={styles.total}>
              Разом:
              <span className={styles.totalValue}>{formatPrice(total)} ₴</span>
            </p>
            <button type="button" className={styles.buyAll} onClick={handleBuyAll}>
              Купити все
            </button>
          </div>
        )}
      </div>

      {listed.length > 0 && (
        <>
          <p className={styles.hint}>Щоб прибрати товар зі списку, натисніть на сердечко.</p>

          <div className={styles.grid}>
            {listed.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                backendId={product.backendId}
                variantId={product.variantId}
                title={product.title}
                price={product.price}
                oldPrice={product.oldPrice}
                image={product.image}
                rating={product.rating}
                isPromo={product.isPromo}
                fluid
              />
            ))}
          </div>
        </>
      )}

      {unavailableCount > 0 && (
        <p className={styles.notice}>
          Ще {unavailableCount} {pluralize(unavailableCount, PRODUCT_FORMS)} зі списку зараз
          недоступні в каталозі.
        </p>
      )}
    </div>
  );
}