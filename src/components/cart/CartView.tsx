"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "../../context/CartContext";
import { pluralize } from "../../lib/format";
import CartItemRow from "./CartItemRow";
import CartSummary from "./CartSummary";
import styles from "./CartView.module.css";

const FAKE_CHECKOUT_DELAY = 900;

// Імітація номера замовлення, доки немає бекенду
function generateOrderNumber() {
  return String(Math.floor(100000000 + Math.random() * 900000000));
}

export default function CartView() {
  const { items, isReady, totalCount, totalPrice, totalOldPrice, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleCheckout() {
    setIsSubmitting(true);
    timerRef.current = setTimeout(() => {
      setOrderNumber(generateOrderNumber());
      clearCart();
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, FAKE_CHECKOUT_DELAY);
  }

  function handleClear() {
    if (window.confirm("Видалити всі товари з кошика?")) {
      clearCart();
    }
  }

  // Поки кошик читається з localStorage — заглушка, щоб не блимав порожній стан
  if (!isReady) {
    return (
      <div className={styles.layout} aria-busy="true">
        <div className={`${styles.skeleton} ${styles.skeletonList}`} />
        <div className={`${styles.skeleton} ${styles.skeletonSummary}`} />
      </div>
    );
  }

  if (orderNumber) {
    return (
      <section className={styles.stateCard}>
        <div className={`${styles.stateIcon} ${styles.stateIconSuccess}`}>✓</div>
        <h2 className={styles.stateTitle}>Дякуємо за замовлення!</h2>
        <p className={styles.stateText}>
          Замовлення <strong>№ {orderNumber}</strong> прийнято. Ми надішлемо підтвердження та
          інформацію про доставку найближчим часом.
        </p>
        <div className={styles.stateActions}>
          <Link href="/" className={styles.primaryButton}>
            Продовжити покупки
          </Link>
          <Link href="/account/orders" className={styles.secondaryButton}>
            Мої замовлення
          </Link>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className={styles.stateCard}>
        <div className={styles.stateIcon}>
          <img src="/icons/shop.svg" alt="" className={styles.stateIconImg} />
        </div>
        <h2 className={styles.stateTitle}>Кошик порожній</h2>
        <p className={styles.stateText}>
          Але це ніколи не пізно виправити :) Перегляньте каталог і додайте щось цікаве.
        </p>
        <div className={styles.stateActions}>
          <Link href="/" className={styles.primaryButton}>
            Перейти до покупок
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className={styles.layout}>
      <section className={styles.listCard}>
        <div className={styles.listHead}>
          <span className={styles.listCount}>
            {totalCount} {pluralize(totalCount, ["товар", "товари", "товарів"])}
          </span>
          <button type="button" className={styles.clearButton} onClick={handleClear}>
            Очистити кошик
          </button>
        </div>

        <ul className={styles.list}>
          {items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </ul>
      </section>

      <CartSummary
        totalCount={totalCount}
        totalPrice={totalPrice}
        totalOldPrice={totalOldPrice}
        isSubmitting={isSubmitting}
        onCheckout={handleCheckout}
      />
    </div>
  );
}