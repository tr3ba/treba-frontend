"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { pluralize } from "../../lib/format";
import CartItemRow from "./CartItemRow";
import CartSummary from "./CartSummary";
import styles from "./CartView.module.css";
import Icon from "../common/Icon";

export default function CartView() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, isReady, totalCount, totalPrice, totalOldPrice, clearCart } = useCart();

  // Оформлення — лише для тих, хто увійшов; гостя ведемо на вхід і назад на /checkout
  function handleCheckout() {
    router.push(user ? "/checkout" : "/login?next=/checkout");
  }

  function handleClear() {
    if (window.confirm("Видалити всі товари з кошика?")) {
      void clearCart();
    }
  }

  // Поки кошик завантажується — заглушка, щоб не блимав порожній стан
  if (!isReady) {
    return (
      <div className={styles.layout} aria-busy="true">
        <div className={`${styles.skeleton} ${styles.skeletonList}`} />
        <div className={`${styles.skeleton} ${styles.skeletonSummary}`} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <section className={styles.stateCard}>
        <div className={styles.stateIcon}>
          <Icon src="/icons/shop.svg" alt="" className={styles.stateIconImg} />
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
        onCheckout={handleCheckout}
      />
    </div>
  );
}