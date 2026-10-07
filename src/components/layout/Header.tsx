import Link from "next/link";
import CatalogMenu from "../home/CatalogMenu";
import SearchBar from "../home/SearchBar";
import UserMenu from "../home/UserMenu";
import HeaderCartButton from "./HeaderCartButton";
import styles from "./Header.module.css";

// Синій header + верхня промо-плашка
export default function Header() {
  return (
    <>
      <div className={styles.topPromo}>
        <p className={styles.topPromoText}>Перша доставка за 0₴</p>
      </div>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button type="button" className={styles.menuButton} aria-label="Меню">
            <img src="/icons/menu.svg" alt="" className={styles.menuIcon} />
          </button>

          <Link href="/" className={styles.logoLink}>
            <img src="/logo/MainLogo.svg" alt="Treba" className={styles.logo} />
          </Link>

          <CatalogMenu />

          <SearchBar />

          <div className={styles.headerActions}>
            <button type="button" className={styles.actionButton} aria-label="Список бажань">
              <span className={`${styles.iconSwap} ${styles.heartIcon}`}>
                <img src="/icons/heart.svg" alt="" className={styles.iconOutline} />
                <img src="/icons/heart1.svg" alt="" className={styles.iconFilled} />
              </span>
            </button>

            <UserMenu />

            <HeaderCartButton />
          </div>
        </div>
      </header>
    </>
  );
}