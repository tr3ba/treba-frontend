import Image from "next/image";
import styles from "./ProductBundle.module.css";
import { Product } from "../../types/product";

type ProductBundleProps = {
  product: Product;
};

function toNumber(price: string) {
  return Number(price.replace(/\s/g, "").replace(",", "."));
}

function formatPrice(value: number) {
  return value.toLocaleString("uk-UA");
}

export default function ProductBundle({ product }: ProductBundleProps) {
  const accessory = product.accessories?.[0];

  if (!accessory) return null;

  const total = toNumber(product.price) + toNumber(accessory.price);
  const comboCode = `${product.code ?? product.id}-${accessory.id}`;
  const productImage = product.images?.[0] ?? product.image;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Разом дешевше</h2>

      <div className={styles.card}>
        <div className={styles.itemsRow}>
          <div className={styles.item}>
            {productImage && (
              <div className={styles.imageWrap}>
                <Image src={productImage} alt={product.title} fill className={styles.image} sizes="90px" />
              </div>
            )}
            <div className={styles.itemText}>
              <p className={styles.itemName}>{product.title}</p>
              <p className={styles.itemPrice}>{product.price} ₴</p>
            </div>
          </div>

          <span className={styles.plus} aria-hidden="true">
            +
          </span>

          <div className={styles.item}>
            <div className={styles.imageWrap}>
              <Image src={accessory.image} alt={accessory.title} fill className={styles.image} sizes="90px" />
            </div>
            <div className={styles.itemText}>
              <p className={styles.itemName}>{accessory.title}</p>
              <p className={styles.itemPrice}>{accessory.price} ₴</p>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.comboCode}>Код комплекту: {comboCode}</span>

          <div className={styles.totalRow}>
            <span className={styles.totalPrice}>{formatPrice(total)} ₴</span>
            <button type="button" className={styles.buyButton}>
              Купити комплект
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}