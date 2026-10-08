"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import styles from "./AccountSidebar.module.css";

// Пункти навігації особистого кабінету
const navItems = [
  { label: "Особисті дані", icon: "/icons/user.svg", href: "/account" },
  { label: "Замовлення", icon: "/icons/box.svg", href: "/account/orders" },
  {
    label: "Листування з продавцями",
    icon: "/icons/chat1.svg",
    href: "/account/messages",
  },
  {
    label: "Персональні пропозиції",
    icon: "/icons/revised.svg",
    href: "/account/proposals",
  },
  { label: "Кошик", icon: "/icons/cart.svg", href: "/account/cart" },
  { label: "Списки бажань", icon: "/icons/heart2.svg", href: "/account/wishlist" },
  {
    label: "Списки порівнянь",
    icon: "/icons/libra.svg",
    href: "/account/comparisons",
  },
  {
    label: "Сервіс та повернення",
    icon: "/icons/return1.svg",
    href: "/account/service",
  },
  { label: "Переглянуті товари", icon: "/icons/eye.svg", href: "/account/viewed" },
  { label: "Участь в акціях", icon: "/icons/promotion.svg", href: "/account/promotions" },
  { label: "Відгуки", icon: "/icons/reviews.svg", href: "/account/reviews" },
  { label: "Розміри", icon: "/icons/sizes.svg", href: "/account/sizes" },
  {
    label: "Подарункові сертифікати",
    icon: "/icons/certificates.svg",
    href: "/account/certificates",
  },
  { label: "Посилки", icon: "/icons/delivery.svg", href: "/account/parcels" },
  { label: "Гаманець", icon: "/icons/wallet.svg", href: "/account/wallet" },
  { label: "Підписки", icon: "/icons/subscriptions.svg", href: "/account/subscriptions" },
];

export default function AccountSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  // Планшет и телефон: список разделов свёрнут в кнопку с текущим разделом
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!user) return null;

  const currentItem = navItems.find((item) => item.href === pathname) ?? navItems[0];

  return (
    <aside className={styles.sidebar}>
      <section className={styles.userCard}>
        <span className={styles.userIconWrap}>
          <img src="/icons/user1.svg" alt="" className={styles.userIcon} />
        </span>
        <div className={styles.userInfo}>
          <p className={styles.userName}>{user.name || "Без імені"}</p>
          <p className={styles.userEmail}>{user.email}</p>
        </div>
      </section>

      <button
        type="button"
        className={styles.sectionToggle}
        aria-expanded={isMenuOpen}
        aria-controls="account-sections"
        onClick={() => setIsMenuOpen((prev) => !prev)}
      >
        <img src={currentItem.icon} alt="" className={styles.toggleIcon} />
        <span className={styles.toggleText}>
          <span className={styles.toggleHint}>Розділ кабінету</span>
          <span className={styles.toggleLabel}>{currentItem.label}</span>
        </span>
        <svg
          className={`${styles.toggleChevron} ${isMenuOpen ? styles.toggleChevronOpen : ""}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            d="M3 6l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <nav
        id="account-sections"
        className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ""}`}
        aria-label="Розділи кабінету"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              aria-current={isActive ? "page" : undefined}
              onClick={() => setIsMenuOpen(false)}
            >
              <img src={item.icon} alt="" className={styles.navIcon} />
              <span className={styles.navText}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}