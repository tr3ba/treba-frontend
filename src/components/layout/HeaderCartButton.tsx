"use client";

import Link from "next/link";
import pageStyles from "../../app/page.module.css";
import { useCart } from "../../context/CartContext";
import styles from "./HeaderCartButton.module.css";

// Іконка кошика в шапці з лічильником товарів
export default function HeaderCartButton() {
  const { totalCount, isReady } = useCart();
  const showBadge = isReady && totalCount > 0;

  return (
    <Link
      href="/cart"
      className={`${pageStyles.actionButton} ${styles.wrap}`}
      aria-label={showBadge ? `Кошик, товарів: ${totalCount}` : "Кошик"}
    >
      <span className={`${pageStyles.iconSwap} ${pageStyles.headerCartIcon}`}>
        <img src="/icons/shop.svg" alt="" className={pageStyles.iconOutline} />
        <img src="/icons/shop1.svg" alt="" className={pageStyles.iconFilled} />
      </span>

      {showBadge && (
        <span className={styles.badge} key={totalCount}>
          {totalCount > 99 ? "99+" : totalCount}
        </span>
      )}
    </Link>
  );
}