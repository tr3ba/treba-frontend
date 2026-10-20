import Link from "next/link";
import CatalogMenu from "../home/CatalogMenu";
import SearchBar from "../home/SearchBar";
import UserMenu from "../home/UserMenu";
import HeaderCartButton from "./HeaderCartButton";
import HeaderWishlistButton from "./HeaderWishlistButton";
import MobileCatalog from "./MobileCatalog";
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
          {/* бургер с каталогом — только на планшете и телефоне */}
          <MobileCatalog />

          <Link href="/" className={styles.logoLink}>
            <img src="/logo/MainLogo.svg" alt="Treba" className={styles.logo} />
          </Link>

          {/* на планшете и телефоне каталог открывается через бургер */}
          <div className={styles.catalogSlot}>
            <CatalogMenu />
          </div>

          <SearchBar />

          <div className={styles.headerActions}>
            {/* на телефоне скрыто классом wishlistButton */}
            <HeaderWishlistButton className={styles.wishlistButton} />

            <UserMenu />

            <HeaderCartButton />
          </div>
        </div>
      </header>
    </>
  );
}