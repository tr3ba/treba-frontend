import styles from "./ProductServices.module.css";
import { ProductService } from "../../types/product";

type ProductServicesProps = {
  services: ProductService[];
};

export default function ProductServices({ services }: ProductServicesProps) {
  if (services.length === 0) return null;

  return (
    <section id="services" className={styles.section}>
      <h2 className={styles.title}>Сервіси</h2>

      <div className={styles.grid}>
        {services.map((service) => (
          <div key={service.id} className={styles.card}>
            <p className={styles.name}>{service.title}</p>
            <p className={styles.description}>{service.description}</p>
            <p className={styles.price}>{service.price}₴</p>
          </div>
        ))}
      </div>
    </section>
  );
}