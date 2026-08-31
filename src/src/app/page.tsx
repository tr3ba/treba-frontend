import styles from "./page.module.css";
import ProductCard from "../components/home/ProductCard";
import BannerSlider from "../components/home/BannerSlider";
import FooterAbout from "../components/home/FooterAbout";
import Footer from "../components/home/Footer";
import Header from "../components/layout/Header";
import { getBestOffersProducts, getRecommendedProducts } from "../lib/api/products";
import { getCategories } from "../lib/api/categories";
import React from "react";

export default async function Home() {
  const [bestOffers, recommended, categories] = await Promise.all([
    getBestOffersProducts(),
    getRecommendedProducts(),
    getCategories(),
  ]);

  return (
    <>
     <main className={styles.page}>
      <Header />

      {/* Основной каркас: левая колонка + дальнейший контент */}
      <div className={styles.pageContent}>
        <div className={styles.leftColumn}>
          {/* Левое меню категорий */}
          <aside className={styles.sidebar}>
            <nav className={styles.categoryNav} aria-label="Категорії">
  {categories.map((category) => (
    <a key={category.id} className={styles.categoryItem} href="#">
      <img src={category.icon} alt="" className={styles.categoryIcon} />
      <span className={styles.categoryText}>{category.label}</span>
    </a>
  ))}

  {}
  <a className={styles.categoryItem} href="#">
    <img src="/icons/chat.svg" alt="" className={styles.categoryIcon} />
    <span className={styles.categoryText}>Чат з TREBA</span>
  </a>

  <a className={styles.categoryItem} href="#">
    <img src="/icons/box.svg" alt="" className={styles.categoryIcon} />
    <span className={styles.categoryText}>Відстежити посилку</span>
  </a>
</nav>
          </aside>

          {/* Два блока под меню */}
          <div className={styles.sidebarBottom}>
            <section className={styles.welcomeCard}>
              <h2 className={styles.welcomeTitle}>Ласкаво просимо!</h2>
              <p className={styles.welcomeText}>
                Увійдіть, щоб отримувати рекомендації, персональні бонуси та знижки.
              </p>
              <button className={styles.welcomeButton}>
                Увійдіть до особистого кабінету
              </button>
            </section>

            <section className={styles.socialCard}>
              <p className={styles.socialTitle}>Ми в соціальних мережах</p>
              <div className={styles.socialIconsRow}>
                <a href="#" className={styles.socialIcon}>
                  <img src="/icons/facebook.svg" alt="Facebook" />
                </a>
                <a href="#" className={styles.socialIcon}>
                  <img src="/icons/instagram.svg" alt="Instagram" />
                </a>
                <a href="#" className={styles.socialIcon}>
                  <img src="/icons/youtube.svg" alt="YouTube" />
                </a>
                <a href="#" className={styles.socialIcon}>
                  <img src="/icons/TikTok.svg" alt="TikTok" />
                </a>
              </div>
            </section>
          </div>
        </div>

        
        <div className={styles.mainContent}>
  <section className={styles.mainBannerSection}>
    <BannerSlider />
  </section>

<section className={styles.bannerBadges}>
  <div className={styles.bannerBadge}>
    <div className={styles.badgeIconWrapper}>
      <img src="/icons/track.svg" alt="" className={styles.badgeIcon} />
    </div>
    <div className={styles.badgeTextWrapper}>
      <p className={styles.badgeTitle}>Доставка</p>
      <p className={styles.badgeSubtitle}>Самовивіз із магазину «Treba», доставка за адресою або у відділення «Нова Пошта» і «Meest»</p>
    </div>
  </div>

  <div className={styles.bannerBadge}>
    <div className={styles.badgeIconWrapper}>
      <img src="/icons/return.svg" alt="" className={styles.badgeIcon} />
    </div>
    <div className={styles.badgeTextWrapper}>
      <p className={styles.badgeTitle}>Повернення</p>
      <p className={styles.badgeSubtitle}>Повернення товару відбувається протягом 14 днів після покупки, у відповідності із діючим законом.</p>
    </div>
  </div>

  <div className={styles.bannerBadge}>
    <div className={styles.badgeIconWrapper}>
      <img src="/icons/warranty.svg" alt="" className={styles.badgeIcon} />
    </div>
    <div className={styles.badgeTextWrapper}>
      <p className={styles.badgeTitle}>Гарантія</p>
                <p className={styles.badgeSubtitle}>Сертифікована техніка з</p>
                      <p className={styles.badgeSubtitle}>офіційною гарантією від виробника.</p>

    </div>
            </div>
            
            
 </section>
<section className={styles.productsSection}>
  <h2 className={styles.productsTitle}>Найкращі пропозиції для вас</h2>

  {bestOffers.length === 0 ? (
    <p>Товарів поки немає</p>
  ) : (
    <div className={styles.productsGrid}>
      {bestOffers.map((product, index) => (
        <React.Fragment key={product.id}>
          <ProductCard
            id={product.id}
            title={product.title}
            price={product.price}
            oldPrice={product.oldPrice}
            image={product.image}
            rating={product.rating}
            isPromo={product.isPromo}
          />
          {index === 4 && (
            <div className={styles.promoCard}>
              <img src="/banners/card-banner.png" alt="Літній чіназес" className={styles.promoCardImage} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )}
</section>
          <section className={styles.secondBannerSection}>
  <img
    src="/banners/second-banner.png"
    alt="Другий банер"
    className={styles.secondBanner}
  />
          </section>
          
          <section className={styles.productsSection}>
  <h2 className={styles.productsTitle}>Рекомендації на основі Ваших переглядів</h2>

  {recommended.length === 0 ? (
    <p>Товарів поки немає</p>
  ) : (
    <div className={styles.productsGrid}>
      {recommended.map((product) => (
  <ProductCard
    key={product.id}
    id={product.id}
    title={product.title}
    price={product.price}
    oldPrice={product.oldPrice}
    image={product.image}
    rating={product.rating}
    isPromo={product.isPromo}
  />
))}
    </div>
  )}
</section>
          
          
        </div>
        
      </div>
      <FooterAbout />
    </main>
    <Footer />
    </>
  );
}