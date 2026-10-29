"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { canOpenAdmin, workspaceLabel } from "../../lib/admin";
import styles from "./AccountSidebar.module.css";
import Icon from "../common/Icon";

export type AccountNavItem = {
  label: string;
  icon: string;
  href: string;
};

// Пункти навігації особистого кабінету покупця (за замовчуванням)
export const accountNavItems: AccountNavItem[] = [
  { label: "Сповіщення", icon: "/icons/chat1.svg", href: "/account/notifications" },
  { label: "Особисті дані", icon: "/icons/user.svg", href: "/account" },
  { label: "Замовлення", icon: "/icons/box.svg", href: "/account/orders" },
  {
    label: "Повідомлення та підтримка",
    icon: "/icons/chat1.svg",
    href: "/account/messages",
  },
  {
    label: "Персональні пропозиції",
    icon: "/icons/revised.svg",
    href: "/account/proposals",
  },
  { label: "Кошик", icon: "/icons/cart.svg", href: "/account/cart" },
  { label: "Список бажань", icon: "/icons/heart2.svg", href: "/account/wishlist" },
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

type AccountSidebarProps = {
  /** Пункти меню; без пропа — меню кабінету покупця */
  items?: AccountNavItem[];
  /** Підпис над поточним розділом у згорнутому меню (планшет/телефон) */
  toggleHint?: string;
  /** aria-label для навігації */
  navLabel?: string;
};

export default function AccountSidebar({
  items = accountNavItems,
  toggleHint = "Розділ кабінету",
  navLabel = "Розділи кабінету",
}: AccountSidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  // Планшет и телефон: список разделов свёрнут в кнопку с текущим разделом
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!user) return null;

  const currentItem = items.find((item) => item.href === pathname) ?? items[0];

  return (
    <aside className={styles.sidebar}>
      <section className={styles.userCard}>
        <span className={styles.userIconWrap}>
          <Icon src="/icons/user1.svg" alt="" className={styles.userIcon} />
        </span>
        <div className={styles.userInfo}>
          <p className={styles.userName}>{user.name || "Без імені"}</p>
          <p className={styles.userEmail}>{user.email}</p>
        </div>
      </section>

      {canOpenAdmin(user.role) && (
        <a href={"/admin"} className={styles.adminEntry}>
          {workspaceLabel(user.role)}
          <span aria-hidden="true">↗</span>
        </a>
      )}

      <button
        type="button"
        className={styles.sectionToggle}
        aria-expanded={isMenuOpen}
        aria-controls="account-sections"
        onClick={() => setIsMenuOpen((prev) => !prev)}
      >
        <Icon src={currentItem.icon} alt="" className={styles.toggleIcon} />
        <span className={styles.toggleText}>
          <span className={styles.toggleHint}>{toggleHint}</span>
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
        aria-label={navLabel}
      >
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              aria-current={isActive ? "page" : undefined}
              onClick={() => setIsMenuOpen(false)}
            >
              <Icon src={item.icon} alt="" className={styles.navIcon} />
              <span className={styles.navText}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
