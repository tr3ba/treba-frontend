import Link from "next/link";
import CatalogMenu from "../home/CatalogMenu";
import SearchBar from "../home/SearchBar";
import UserMenu from "../home/UserMenu";
import HeaderCartButton from "./HeaderCartButton";
import HeaderCompareButton from "./HeaderCompareButton";
import HeaderWishlistButton from "./HeaderWishlistButton";
import MobileCatalog from "./MobileCatalog";
import styles from "./Header.module.css";
import Icon from "../common/Icon";
import Notifications from "../account/Notifications";

// Синій header + верхня промо-плашка.
// На телефоне (≤768px), как в мобильной версии Rozetka: бургер · логотип · поиск · кошик.
// Порівняння, бажання и профиль — в нижней панели (MobileTabBar).
export default function Header() {
  return (
    <>
      <div className={styles.topPromo}>
        <p className={styles.topPromoText}>Перша доставка за 0₴</p>
      </div>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          {/* бургер с каталогом — на планшете и телефоне */}
          <div className={styles.burgerSlot}>
            <MobileCatalog />
          </div>

          <Link href="/" className={styles.logoLink}>
            <Icon src="/logo/MainLogo.svg" alt="Treba" className={styles.logo} />
          </Link>

          {/* на планшете и телефоне каталог открывается через бургер */}
          <div className={styles.catalogSlot}>
            <CatalogMenu />
          </div>

          <SearchBar />

          {/* Гість: бажання · профіль · кошик.
              Після входу: порівняння · сповіщення · бажання · профіль · кошик.
              Кошик завжди крайній справа, профіль поруч — нові іконки з'являються зліва. */}
          <div className={styles.headerActions}>
            {/* на ПК обёртка «прозрачная» (display: contents), на телефоне скрыта */}
            <div className={styles.phoneHidden}>
              {/* только после входа */}
              <HeaderCompareButton />

              {/* только после входа */}
              <Notifications />

              <HeaderWishlistButton />

              <UserMenu />
            </div>

            <HeaderCartButton />
          </div>
        </div>
      </header>
    </>
  );
}