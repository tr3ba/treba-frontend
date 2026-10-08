"use client";

import Link from "next/link";
import { useCart } from "../../context/CartContext";
import styles from "./HeaderCartButton.module.css";

// Іконка кошика в шапці з лічильником товарів
export default function HeaderCartButton() {
  const { totalCount, isReady } = useCart();
  const showBadge = isReady && totalCount > 0;

  return (
    <Link
      href="/cart"
      className={styles.wrap}
      aria-label={showBadge ? `Кошик, товарів: ${totalCount}` : "Кошик"}
    >
      <span className={`${styles.iconSwap} ${styles.cartIcon}`}>
        <img src="/icons/shop.svg" alt="" className={styles.iconOutline} />
        <img src="/icons/shop1.svg" alt="" className={styles.iconFilled} />
      </span>

      {showBadge && (
        <span className={styles.badge} key={totalCount}>
          {totalCount > 99 ? "99+" : totalCount}
        </span>
      )}
    </Link>
  );
}