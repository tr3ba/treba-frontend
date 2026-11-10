import Image from "next/image";
import Link from "next/link";
import styles from "../../app/(store)/page.module.css";
import ProductCard from "./ProductCard";
import BannerSlider from "./BannerSlider";
import FooterAbout from "./FooterAbout";
import Footer from "./Footer";
import Header from "../layout/Header";
import Icon from "../common/Icon";
import WelcomeCard from "./WelcomeCard";
import { HOME_SOCIAL_NAMES, SOCIAL_LINKS } from "../../data/socialLinks";
import { getBestOffersProducts, getRecommendedProducts } from "../../lib/api/products";
import { getCategories } from "../../lib/api/categories";
import React from "react";

// Соцмережі для картки на головній — у порядку HOME_SOCIAL_NAMES
const homeSocialLinks = HOME_SOCIAL_NAMES.flatMap((name) => SOCIAL_LINKS.filter((social) => social.name === name));

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
    <Link key={category.id} className={styles.categoryItem} href={`/catalog/${category.id}`}>
      <Icon src={category.icon} alt="" className={styles.categoryIcon} />
      <span className={styles.categoryText}>{category.label}</span>
    </Link>
  ))}

  <Link className={styles.categoryItem} href="/account/messages?new=chat">
    <Icon src="/icons/chat.svg" alt="" className={styles.categoryIcon} />
    <span className={styles.categoryText}>Чат з TREBA</span>
  </Link>

  <Link className={styles.categoryItem} href="/account/parcels">
    <Icon src="/icons/box.svg" alt="" className={styles.categoryIcon} />
    <span className={styles.categoryText}>Відстежити посилку</span>
  </Link>
</nav>
          </aside>

          {/* Два блока под меню */}
          <div className={styles.sidebarBottom}>
            <WelcomeCard />

            <section className={styles.socialCard}>
              <p className={styles.socialTitle}>Ми в соціальних мережах</p>
              <div className={styles.socialIconsRow}>
                {homeSocialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialIcon}
                    aria-label={social.name}
                  >
                    <Icon src={social.icon} alt={social.name} />
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>

        
        <div className={styles.mainContent}>
  <section className={styles.mainBannerSection}>
    <BannerSlider />
  </section>

{/* Переваги. На ПК — три плашки з повним текстом.
    На телефоні — дві компактні (Повернення, Гарантія) з коротким текстом badgeShort. */}
<section className={styles.bannerBadges} aria-label="Переваги TREBA">
  <div className={`${styles.bannerBadge} ${styles.bannerBadgeDelivery}`}>
    <div className={styles.badgeIconWrapper}>
      <Icon src="/icons/track.svg" alt="" className={styles.badgeIcon} />
    </div>
    <div className={styles.badgeTextWrapper}>
      <p className={styles.badgeTitle}>Доставка</p>
      <p className={styles.badgeSubtitle}>Самовивіз із магазину «Treba», доставка за адресою або у відділення «Нова Пошта» і «Meest»</p>
    </div>
  </div>

  <div className={styles.bannerBadge}>
    <div className={styles.badgeIconWrapper}>
      <Icon src="/icons/return.svg" alt="" className={styles.badgeIcon} />
    </div>
    <div className={styles.badgeTextWrapper}>
      <p className={styles.badgeTitle}>Повернення</p>
      <p className={styles.badgeSubtitle}>Повернення товару відбувається протягом 14 днів після покупки, у відповідності із діючим законом.</p>
      <p className={styles.badgeShort}>14 днів на повернення товару</p>
    </div>
  </div>

  <div className={styles.bannerBadge}>
    <div className={styles.badgeIconWrapper}>
      <Icon src="/icons/warranty.svg" alt="" className={styles.badgeIcon} />
    </div>
    <div className={styles.badgeTextWrapper}>
      <p className={styles.badgeTitle}>Гарантія</p>
      <p className={styles.badgeSubtitle}>Сертифікована техніка з</p>
      <p className={styles.badgeSubtitle}>офіційною гарантією від виробника.</p>
      <p className={styles.badgeShort}>Офіційна гарантія виробника</p>
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
            backendId={product.backendId}
            variantId={product.variantId}
            title={product.title}
            price={product.price}
            oldPrice={product.oldPrice}
            image={product.image}
            rating={product.rating}
            isPromo={product.isPromo}
            fluid
          />
          {index === 4 && (
            <div className={styles.promoCard}>
              <Image
                src="/banners/card-banner.png"
                alt="Літній чіназес"
                width={434}
                height={560}
                sizes="(max-width: 768px) 50vw, 217px"
                className={styles.promoCardImage}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )}
</section>
          <section className={styles.secondBannerSection}>
  <Image
    src="/banners/second-banner.png"
    alt="Другий банер"
    width={1384}
    height={184}
    sizes="(max-width: 1440px) 100vw, 1384px"
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
    backendId={product.backendId}
    variantId={product.variantId}
    title={product.title}
    price={product.price}
    oldPrice={product.oldPrice}
    image={product.image}
    rating={product.rating}
    isPromo={product.isPromo}
    fluid
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