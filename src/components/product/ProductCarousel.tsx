import ProductCard from "../home/ProductCard";
import { Product } from "../../types/product";
import styles from "./ProductCarousel.module.css";

type ProductCarouselProps = {
  title: string;
  products: Product[];
};

export default function ProductCarousel({ title, products }: ProductCarouselProps) {
  if (products.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>

      <div className={styles.track}>
        {products.map((product) => (
          <div key={product.id} className={styles.item}>
            <ProductCard
              id={product.id}
              title={product.title}
              price={product.price}
              oldPrice={product.oldPrice}
              image={product.image}
              rating={product.rating}
              isPromo={product.isPromo}
            />
          </div>
        ))}
      </div>
    </section>
  );
}