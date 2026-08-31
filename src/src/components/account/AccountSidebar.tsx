"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import styles from "./AccountSidebar.module.css";

// Пункти навігації особистого кабінету
const navItems = [
  { label: "Особисті дані", icon: "/icons/user1.svg", href: "/account" },
  { label: "Замовлення", icon: "/icons/box.svg", href: "/account/orders" },
  {
    label: "Листування з продавцями",
    icon: "/icons/chat.svg",
    href: "/account/messages",
  },
  {
    label: "Персональні пропозиції",
    icon: "/icons/discount.svg",
    href: "/account/proposals",
  },
  { label: "Кошик", icon: "/icons/shop.svg", href: "/account/cart" },
  { label: "Списки бажань", icon: "/icons/heart.svg", href: "/account/wishlist" },
  {
    label: "Списки порівнянь",
    icon: "/icons/circle.svg",
    href: "/account/comparisons",
  },
  {
    label: "Сервіс та повернення",
    icon: "/icons/returns.svg",
    href: "/account/service",
  },
  { label: "Переглянуті товари", icon: "/icons/track.svg", href: "/account/viewed" },
  { label: "Участь в акціях", icon: "/icons/gamepad.svg", href: "/account/promotions" },
  { label: "Відгуки", icon: "/icons/star.svg", href: "/account/reviews" },
  { label: "Розміри", icon: "/icons/clothes.svg", href: "/account/sizes" },
  {
    label: "Подарункові сертифікати",
    icon: "/icons/discount.svg",
    href: "/account/certificates",
  },
  { label: "Посилки", icon: "/icons/delivery.svg", href: "/account/parcels" },
  { label: "Гаманець", icon: "/icons/warranty.svg", href: "/account/wallet" },
  { label: "Підписки", icon: "/icons/telegram.svg", href: "/account/subscriptions" },
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