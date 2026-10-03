import Link from "next/link";
import pageStyles from "../../app/page.module.css";
import CatalogMenu from "../home/CatalogMenu";
import SearchBar from "../home/SearchBar";
import UserMenu from "../home/UserMenu";
import HeaderCartButton from "./HeaderCartButton";

// Синій header + верхня промо-плашка
export default function Header() {
  return (
    <>
      <div className={pageStyles.topPromo}>
        <div className={pageStyles.topPromoPattern} aria-hidden="true" />
        <p className={pageStyles.topPromoText}>Перша доставка за 0₴</p>
      </div>

      <header className={pageStyles.header}>
        <div className={pageStyles.headerInner}>
          <button className={pageStyles.menuButton} aria-label="Меню">
            <img src="/icons/menu.svg" alt="" className={pageStyles.menuIcon} />
          </button>

          <Link href="/" className={pageStyles.logoLink}>
            <img src="/logo/MainLogo.svg" alt="Treba" className={pageStyles.logo} />
          </Link>

          <CatalogMenu />

          <SearchBar />

          <div className={pageStyles.headerActions}>
            <button className={pageStyles.actionButton} aria-label="Список бажань">
              <span className={`${pageStyles.iconSwap} ${pageStyles.heartIcon}`}>
                <img src="/icons/heart.svg" alt="" className={pageStyles.iconOutline} />
                <img src="/icons/heart1.svg" alt="" className={pageStyles.iconFilled} />
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