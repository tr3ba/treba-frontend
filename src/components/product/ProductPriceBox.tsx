"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { parsePrice } from "../../lib/format";
import WishlistButton from "../wishlist/WishlistButton";
import CompareButton from "../comparison/CompareButton";
import styles from "./ProductPriceBox.module.css";
import { ProductVariant } from "../../types/product";

type ProductPriceBoxProps = {
  id: string;
  /** Guid товара на бэке — нужен списку бажань */
  backendId?: string;
  /** Guid варианта по умолчанию — нужен корзине на бэке */
  variantId?: string;
  /** Категорії — за кінцевою групуються списки порівняння */
  categoryId?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  title: string;
  image?: string;
  price: string;
  oldPrice?: string | null;
  isPromo?: boolean;
  inStock?: boolean;
  variants?: ProductVariant[];
};

export default function ProductPriceBox({
  id,
  backendId,
  variantId,
  categoryId,
  subcategoryId,
  subcategoryName,
  title,
  image,
  price,
  oldPrice,
  isPromo,
  inStock = true,
  variants,
}: ProductPriceBoxProps) {
  const router = useRouter();
  const { addItem, isInCart } = useCart();
  const [activeVariant, setActiveVariant] = useState(variants?.[0]?.id);

  const inCart = isInCart(id);
  const bonus = Math.round(parsePrice(price) * 0.02);

  function handleBuy() {
    if (!inCart) {
      addItem({ id, variantId, title, image, price, oldPrice: isPromo ? oldPrice : null }, { silent: true });
    }
    router.push("/cart");
  }

  return (
    <div className={styles.box}>
      <div className={styles.topRow}>
        {variants && variants.length > 0 ? (
          <div className={styles.variants}>
            <span className={styles.variantsLabel}>Колір:</span>
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                className={`${styles.swatch} ${activeVariant === variant.id ? styles.swatchActive : ""}`}
                style={{ backgroundColor: variant.colorHex ?? "#e5e3dd" }}
                onClick={() => setActiveVariant(variant.id)}
                disabled={!variant.available}
                aria-label={variant.label}
                title={variant.label}
              />
            ))}
          </div>
        ) : (
          <span />
        )}

        <div className={styles.iconActions}>
          <WishlistButton product={{ id, backendId }} className={styles.wishlistButton} />
          <CompareButton
            product={{ id, categoryId, subcategoryId, subcategoryName, title, image }}
            className={styles.compareButton}
          />
        </div>
      </div>

      {isPromo && oldPrice && <div className={styles.oldPrice}>{oldPrice}₴</div>}

      <div className={styles.priceRow}>
        <span className={styles.price}>{price}</span>
        <span className={styles.currency}>₴</span>
      </div>

      {inStock && bonus > 0 && (
        <p className={styles.bonus}>+ {bonus} бонусних ₴ на рахунок у разі купівлі</p>
      )}

      {inStock ? (
        <div className={styles.buttonRow}>
          <button
            type="button"
            className={`${styles.cartButton} ${inCart ? styles.cartButtonInCart : ""}`}
            onClick={handleBuy}
          >
            {inCart ? "В кошику — оформити" : "Купити"}
          </button>
          <button type="button" className={styles.creditButton}>
            Купити в кредит
          </button>
        </div>
      ) : (
        <>
          <p className={styles.outOfStock}>Товар закінчився</p>
          <button type="button" className={styles.notifyButton}>
            Повідомити про наявність
          </button>
        </>
      )}
    </div>
  );
}