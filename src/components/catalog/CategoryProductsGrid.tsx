import ProductCard from "../home/ProductCard";
import { Product } from "../../types/product";
import styles from "./CategoryProductsGrid.module.css";

type CategoryProductsGridProps = {
  title: string;
  products: Product[];
};

export default function CategoryProductsGrid({ title, products }: CategoryProductsGridProps) {
  if (products.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>

      <div className={styles.grid}>
        {products.map((product) => (
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
    </section>
  );
}