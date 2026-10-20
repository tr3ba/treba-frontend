import Image from "next/image";
import Link from "next/link";
import RatingStars from "./RatingStars";
import type { SellerProfile } from "../../types/seller";
import { formatSinceMonth, pluralize } from "../../lib/format";
import styles from "./SellerHero.module.css";

type SellerHeroProps = {
  seller: SellerProfile;
  productsCount: number;
  categoriesCount: number;
};

// Первые буквы названия — когда у магазина нет логотипа
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function SellerHero({ seller, productsCount, categoriesCount }: SellerHeroProps) {
  const { rating } = seller;

  return (
    <section className={styles.hero} aria-label="Інформація про продавця">
      <nav className={styles.breadcrumbs} aria-label="Хлібні крихти">
        <Link href="/" className={styles.crumb}>
          Головна
        </Link>
        <span className={styles.separator}>/</span>
        <span className={styles.crumbCurrent}>Продавець {seller.name}</span>
      </nav>

      <div className={styles.main}>
        <div className={styles.avatar}>
          {seller.logo ? (
            <Image src={seller.logo} alt={seller.name} width={72} height={72} className={styles.logo} />
          ) : (
            <span className={styles.initials} aria-hidden="true">
              {initials(seller.name)}
            </span>
          )}
        </div>

        <div className={styles.info}>
          <span className={styles.eyebrow}>Продавець</span>
          <h1 className={styles.name}>{seller.name}</h1>

          {rating ? (
            <div className={styles.ratingRow}>
              <span className={styles.ratingValue}>{rating.average.toFixed(1)}</span>
              <RatingStars value={rating.average} />
              <span className={styles.ratingCount}>
                {rating.count} {pluralize(rating.count, ["оцінка", "оцінки", "оцінок"])}
              </span>
            </div>
          ) : (
            <p className={styles.noRating}>Ще немає оцінок</p>
          )}
        </div>
      </div>

      <ul className={styles.facts}>
        {seller.joinedAt && (
          <li className={styles.fact}>
            <span className={styles.factLabel}>На TREBA</span>
            <span className={styles.factValue}>з {formatSinceMonth(seller.joinedAt)}</span>
          </li>
        )}
        <li className={styles.fact}>
          <span className={styles.factLabel}>Асортимент</span>
          <span className={styles.factValue}>
            {productsCount} {pluralize(productsCount, ["товар", "товари", "товарів"])}
          </span>
        </li>
        <li className={styles.fact}>
          <span className={styles.factLabel}>Категорії</span>
          <span className={styles.factValue}>
            {categoriesCount} {pluralize(categoriesCount, ["категорія", "категорії", "категорій"])}
          </span>
        </li>
        {seller.stats && (
          <li className={styles.fact}>
            <span className={styles.factLabel}>Відправка</span>
            <span className={styles.factValue}>≈ {seller.stats.shippingHours} год</span>
          </li>
        )}
      </ul>
    </section>
  );
}