"use client";

import { useState } from "react";
import Link from "next/link";
import { CartItem, MAX_QUANTITY, useCart } from "../../context/CartContext";
import { formatPrice } from "../../lib/format";
import styles from "./CartItemRow.module.css";

type CartItemRowProps = {
  item: CartItem;
};

// Один товар у кошику: фото, назва, ціна, кількість, видалення
export default function CartItemRow({ item }: CartItemRowProps) {
  const { setQuantity, removeItem } = useCart();
  // Чернетка для поля вводу: дозволяє стерти число й набрати нове
  const [draft, setDraft] = useState(String(item.quantity));

  function changeQuantity(next: number) {
    const safe = Math.max(1, Math.min(MAX_QUANTITY, Math.round(next) || 1));
    setQuantity(item.id, safe);
    setDraft(String(safe));
  }

  function commitDraft() {
    changeQuantity(Number(draft));
  }

  const lineTotal = item.price * item.quantity;
  const lineOldTotal = item.oldPrice ? item.oldPrice * item.quantity : null;

  return (
    <li className={styles.row}>
      <Link href={`/product/${item.id}`} className={styles.imageWrap}>
        {item.image ? (
          <img src={item.image} alt={item.title} className={styles.image} />
        ) : (
          <img src="/icons/catalog.svg" alt="" className={styles.placeholder} />
        )}
      </Link>

      <div className={styles.info}>
        <Link href={`/product/${item.id}`} className={styles.title}>
          {item.title}
        </Link>

        <p className={styles.stock}>
          <span className={styles.stockDot} aria-hidden="true" />
          Є в наявності
        </p>

        <p className={styles.unitPrice}>
          {formatPrice(item.price)} ₴ / шт.
          {item.oldPrice && <span className={styles.unitOld}>{formatPrice(item.oldPrice)} ₴</span>}
        </p>
      </div>

      <div className={styles.quantity}>
        <button
          type="button"
          className={styles.qtyButton}
          onClick={() => changeQuantity(item.quantity - 1)}
          disabled={item.quantity <= 1}
          aria-label="Зменшити кількість"
        >
          −
        </button>
        <input
          type="text"
          inputMode="numeric"
          className={styles.qtyInput}
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 2))}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          aria-label="Кількість"
        />
        <button
          type="button"
          className={styles.qtyButton}
          onClick={() => changeQuantity(item.quantity + 1)}
          disabled={item.quantity >= MAX_QUANTITY}
          aria-label="Збільшити кількість"
        >
          +
        </button>
      </div>

      <div className={styles.total}>
        {lineOldTotal && <span className={styles.totalOld}>{formatPrice(lineOldTotal)} ₴</span>}
        <span className={`${styles.totalPrice} ${lineOldTotal ? styles.totalPromo : ""}`}>
          {formatPrice(lineTotal)} ₴
        </span>
      </div>

      <button
        type="button"
        className={styles.remove}
        onClick={() => removeItem(item.id)}
        aria-label={`Видалити «${item.title}» з кошика`}
        title="Видалити"
      >
        ×
      </button>
    </li>
  );
}