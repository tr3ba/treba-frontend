"use client";

import Link from "next/link";
import { useWishlist } from "../../context/WishlistContext";
import styles from "./HeaderWishlistButton.module.css";

type HeaderWishlistButtonProps = {
  /** Доп. класс от шапки (напр. скрыть на телефоне) */
  className?: string;
};

// Сердечко в шапці: посилання на список бажань з лічильником
export default function HeaderWishlistButton({ className }: HeaderWishlistButtonProps) {
  const { count, isReady } = useWishlist();
  const hasItems = isReady && count > 0;

  const classes = [styles.wrap, hasItems ? styles.hasItems : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      href="/account/wishlist"
      className={classes}
      aria-label={hasItems ? `Список бажань, товарів: ${count}` : "Список бажань"}
    >
      <span className={`${styles.iconSwap} ${styles.heartIcon}`}>
        <img src="/icons/heart.svg" alt="" className={styles.iconOutline} />
        <img src="/icons/heart1.svg" alt="" className={styles.iconFilled} />
      </span>

      {hasItems && (
        <span className={styles.badge} key={count}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}