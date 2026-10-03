"use client";

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

  if (!user) return null;

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

      <nav className={styles.nav} aria-label="Розділи кабінету">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
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