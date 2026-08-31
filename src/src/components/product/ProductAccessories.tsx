import Image from "next/image";
import styles from "./ProductAccessories.module.css";
import { ProductAccessory } from "../../types/product";

type ProductAccessoriesProps = {
  accessories: ProductAccessory[];
};

export default function ProductAccessories({ accessories }: ProductAccessoriesProps) {
  if (accessories.length === 0) return null;

  return (
    <section id="accessories" className={styles.section}>
      <h2 className={styles.title}>Аксесуари</h2>

      <div className={styles.list}>
        {accessories.map((item) => (
          <div key={item.id} className={styles.card}>
            <div className={styles.imageWrap}>
              <Image src={item.image} alt={item.title} fill className={styles.image} sizes="120px" />
            </div>
            <p className={styles.name}>{item.title}</p>
            <div className={styles.priceRow}>
              {item.oldPrice && <span className={styles.oldPrice}>{item.oldPrice}₴</span>}
              <span className={styles.price}>{item.price}₴</span>
            </div>
            <button type="button" className={styles.addButton} aria-label="Додати в кошик">
              +
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}