"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../lib/format";
import { getOrderStatusLabel } from "../../lib/api/orders";
import type { CheckoutForm as CheckoutFormValues, CreatedOrder } from "../../types/order";
import CheckoutForm from "./CheckoutForm";
import styles from "./CheckoutView.module.css";

// Сторінка оформлення: стани (вхід / порожній кошик / успіх) + форма
export default function CheckoutView() {
  const { user, isLoading } = useAuth();
  const { items, isReady, totalPrice, totalOldPrice, clearCart } = useCart();
  const [created, setCreated] = useState<CreatedOrder | null>(null);

  async function handleSuccess(order: CreatedOrder) {
    setCreated(order);
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Бэк сам корзину не очищает — делаем это после успешного заказа
    await clearCart();
  }

  let content: React.ReactNode;

  if (created) {
    content = (
      <section className={styles.stateCard}>
        <div className={`${styles.stateIcon} ${styles.stateIconSuccess}`}>✓</div>
        <h2 className={styles.stateTitle}>Замовлення оформлено!</h2>
        <p className={styles.stateText}>
          Номер замовлення: <strong>{created.number}</strong>
          <br />
          До сплати: <strong>{formatPrice(created.total)} ₴</strong>
          {created.deliveryPrice === 0 ? " (доставка безкоштовна)" : ""}
          <br />
          Статус: {getOrderStatusLabel(created.status)}
        </p>
        <p className={styles.stateText}>
          Найближчим часом менеджер зв’яжеться з вами, щоб підтвердити замовлення та оплату.
        </p>
        <div className={styles.stateActions}>
          <Link href="/" className={styles.primaryButton}>
            Продовжити покупки
          </Link>
        </div>
      </section>
    );
  } else if (isLoading || !isReady) {
    content = (
      <div className={styles.layoutSkeleton} aria-busy="true">
        <div className={`${styles.skeleton} ${styles.skeletonForm}`} />
        <div className={`${styles.skeleton} ${styles.skeletonSummary}`} />
      </div>
    );
  } else if (!user) {
    content = (
      <section className={styles.stateCard}>
        <div className={styles.stateIcon}>
          <img src="/icons/user.svg" alt="" className={styles.stateIconImg} />
        </div>
        <h2 className={styles.stateTitle}>Увійдіть, щоб оформити замовлення</h2>
        <p className={styles.stateText}>
          Товари з кошика збережуться — після входу ви повернетеся на цю сторінку.
        </p>
        <div className={styles.stateActions}>
          <Link href="/login?next=/checkout" className={styles.primaryButton}>
            Увійти
          </Link>
          <Link href="/cart" className={styles.secondaryButton}>
            Повернутися до кошика
          </Link>
        </div>
      </section>
    );
  } else if (items.length === 0) {
    content = (
      <section className={styles.stateCard}>
        <div className={styles.stateIcon}>
          <img src="/icons/shop.svg" alt="" className={styles.stateIconImg} />
        </div>
        <h2 className={styles.stateTitle}>Кошик порожній</h2>
        <p className={styles.stateText}>Додайте товари до кошика, щоб оформити замовлення.</p>
        <div className={styles.stateActions}>
          <Link href="/" className={styles.primaryButton}>
            Перейти до покупок
          </Link>
        </div>
      </section>
    );
  } else {
    // Ім’я з профілю: окремі поля або розбиваємо повне ім’я
    const [nameFirst = "", ...nameRest] = (user.name ?? "").trim().split(/\s+/);
    const initial: CheckoutFormValues = {
      firstName: user.firstName ?? nameFirst,
      lastName: user.lastName ?? nameRest.join(" "),
      phone: user.phone ?? "",
      email: user.email ?? "",
      city: user.addressCity ?? "",
      street: user.addressStreet ?? "",
      building: user.addressBuilding ?? "",
      apartment: "",
      comment: "",
    };

    content = (
      <CheckoutForm
        items={items}
        totalPrice={totalPrice}
        totalOldPrice={totalOldPrice}
        initial={initial}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Хлібні крихти">
        <Link href="/" className={styles.crumb}>
          Головна
        </Link>
        <span className={styles.separator}>/</span>
        <Link href="/cart" className={styles.crumb}>
          Кошик
        </Link>
        <span className={styles.separator}>/</span>
        <span className={styles.crumbCurrent}>Оформлення</span>
      </nav>

      <h1 className={styles.title}>Оформлення замовлення</h1>

      {content}
    </main>
  );
}