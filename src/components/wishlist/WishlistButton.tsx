"use client";

import { useWishlist, type WishlistProduct } from "../../context/WishlistContext";
import styles from "./WishlistButton.module.css";

type WishlistButtonProps = {
  product: WishlistProduct;
  /** sm — для карточек товара, md — для блока цены на странице товара */
  size?: "sm" | "md";
  /** Позиционирование задаёт родитель */
  className?: string;
};

// Сердечко «в список бажань». Гостя контекст отправит на вход.
export default function WishlistButton({ product, size = "md", className }: WishlistButtonProps) {
  const { isInWishlist, toggle } = useWishlist();
  const active = isInWishlist(product);
  const label = active ? "Видалити зі списку бажань" : "Додати до списку бажань";

  const classes = [styles.button, size === "sm" ? styles.sm : "", active ? styles.active : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        void toggle(product);
      }}
    >
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path
          className={styles.filled}
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
        <path
          className={styles.outline}
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      </svg>
    </button>
  );
}