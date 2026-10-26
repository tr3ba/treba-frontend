"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import MobileCatalogDrawer from "./MobileCatalogDrawer";
import styles from "./MobileTabBar.module.css";

type TabKey = "home" | "catalog" | "cart" | "wishlist" | "profile";

// Страницы без панели: оформление заказа и лендинг продавца со своим макетом
const HIDDEN_ROUTES = ["/checkout", "/sell"];

function isHiddenOn(pathname: string): boolean {
  return HIDDEN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function getActiveTab(pathname: string): TabKey | null {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/catalog")) return "catalog";
  if (pathname === "/cart") return "cart";
  if (pathname.startsWith("/account/wishlist")) return "wishlist";
  if (pathname.startsWith("/account") || pathname === "/login" || pathname === "/register") return "profile";
  return null;
}

// Нижняя панель навигации — только на телефоне (≤768px), как в приложении Rozetka.
export default function MobileTabBar() {
  const pathname = usePathname() ?? "/";
  const { user } = useAuth();
  const { totalCount, isReady: isCartReady } = useCart();
  const { count: wishlistCount, isReady: isWishlistReady } = useWishlist();
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const closeCatalog = useCallback(() => setIsCatalogOpen(false), []);

  if (isHiddenOn(pathname)) return null;

  const active: TabKey | null = isCatalogOpen ? "catalog" : getActiveTab(pathname);
  const cartBadge = isCartReady ? totalCount : 0;
  const wishlistBadge = isWishlistReady ? wishlistCount : 0;

  const itemClass = (key: TabKey) => (active === key ? `${styles.item} ${styles.active}` : styles.item);
  const current = (key: TabKey) => (active === key && !isCatalogOpen ? "page" : undefined);

  return (
    <>
      {/* место под панелью в конце страницы, чтобы футер не прятался под ней */}
      <div className={styles.spacer} aria-hidden="true" />

      <nav className={styles.bar} aria-label="Мобільна навігація">
        <Link href="/" className={itemClass("home")} aria-current={current("home")}>
          <TabContent label="Головна" icon={<HomeIcon />} />
        </Link>

        <button
          type="button"
          className={itemClass("catalog")}
          aria-expanded={isCatalogOpen}
          onClick={() => setIsCatalogOpen(true)}
        >
          <TabContent label="Каталог" icon={<CatalogIcon />} />
        </button>

        <Link
          href="/cart"
          className={itemClass("cart")}
          aria-current={current("cart")}
          aria-label={cartBadge > 0 ? `Кошик, товарів: ${cartBadge}` : undefined}
        >
          <TabContent label="Кошик" icon={<CartIcon />} badge={cartBadge} />
        </Link>

        <Link
          href="/account/wishlist"
          className={itemClass("wishlist")}
          aria-current={current("wishlist")}
          aria-label={wishlistBadge > 0 ? `Бажання, товарів: ${wishlistBadge}` : undefined}
        >
          <TabContent label="Бажання" icon={<HeartIcon />} badge={wishlistBadge} />
        </Link>

        {/* гость — модалка входа (intercepting route), после входа — кабинет */}
        <Link href={user ? "/account" : "/login"} className={itemClass("profile")} aria-current={current("profile")}>
          <TabContent label="Профіль" icon={<UserIcon />} />
        </Link>
      </nav>

      <MobileCatalogDrawer isOpen={isCatalogOpen} onClose={closeCatalog} />
    </>
  );
}

function TabContent({ label, icon, badge = 0 }: { label: string; icon: ReactNode; badge?: number }) {
  return (
    <>
      <span className={styles.iconWrap}>
        {icon}
        {badge > 0 && (
          <span className={styles.badge} key={badge} aria-hidden="true">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      <span className={styles.label}>{label}</span>
    </>
  );
}

// Иконки — inline SVG с currentColor: цвет и заливка активной вкладки задаются в CSS
function HomeIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 10.2 12 3.5l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-4.2v-5.7H9.2v5.7H5A1.5 1.5 0 0 1 3.5 19z" />
    </svg>
  );
}

function CatalogIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.8 3.8h2.3l2.3 10.6a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.2l1.9-7.3H6" />
      <circle cx="9.5" cy="19.6" r="1.4" />
      <circle cx="17" cy="19.6" r="1.4" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20s-7.4-4.5-9.1-9.2C1.7 7.4 3.9 4 7.3 4c2 0 3.5 1.1 4.7 2.8C13.2 5.1 14.7 4 16.7 4c3.4 0 5.6 3.4 4.4 6.8C19.4 15.5 12 20 12 20z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c0-4.1 3.4-6.6 7.5-6.6s7.5 2.5 7.5 6.6" />
    </svg>
  );
}