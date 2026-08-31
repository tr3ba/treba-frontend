import Image from "next/image";
import Link from "next/link";
import styles from "./ProductCard.module.css";


type ProductCardProps = {
  id: string;
  title: string;
  price: string;
  image?: string;
  rating?: number;
  oldPrice?: string | null;
  isPromo?: boolean;
};

export default function ProductCard({
  id,
  title,
  price,
  image,
  rating = 4.5,
  oldPrice = null,
  isPromo = false,
}: ProductCardProps) {
  return (
    <Link href={`/product/${id}`} className={styles.card}>
      <div className={styles.imageWrap}>
  {image ? (
    <Image
      src={image}
      alt={title}
      fill
      className={styles.image}
      sizes="217px"
    />
  ) : (
    <div className={styles.imagePlaceholder} aria-hidden="true">
      <img src="/icons/catalog.svg" alt="" className={styles.imagePlaceholderIcon} />
    </div>
  )}
</div>

      <h3 className={styles.title}>{title}</h3>

      <div className={styles.ratingRow}>
        <span className={styles.star}>★</span>
        <span className={styles.rating}>{rating}</span>
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.priceBlock}>
          {isPromo && oldPrice ? (
            <div className={styles.oldPrice}>{oldPrice}₴</div>
          ) : null}

          <div className={isPromo ? styles.pricePromo : styles.priceRegular}>
            <span>{price}</span>
            <span className={styles.currency}>₴</span>
          </div>
        </div>

        <button className={styles.cartButton} aria-label="Додати товар у кошик">
  <img src="/icons/shop1.svg" alt="" className={styles.cardCartIcon} />
</button>
      </div>
        </Link>
  );
}