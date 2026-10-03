"use client";

import { useState } from "react";
import styles from "./ProductAddServices.module.css";
import { ProductService } from "../../types/product";

type ProductAddServicesProps = {
  services: ProductService[];
};

export default function ProductAddServices({ services }: ProductAddServicesProps) {
  const [checked, setChecked] = useState<string[]>([]);

  if (services.length === 0) return null;

  const toggle = (id: string) => {
    setChecked((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className={styles.box}>
      <h2 className={styles.title}>Додаткові послуги</h2>

      <div className={styles.list}>
        {services.map((service) => (
          <label key={service.id} className={styles.row}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={checked.includes(service.id)}
              onChange={() => toggle(service.id)}
            />
            <span className={styles.text}>
              <span className={styles.name}>{service.title}</span>
              <span className={styles.description}>{service.description}</span>
            </span>
            <span className={styles.price}>+{service.price}₴</span>
          </label>
        ))}
      </div>
    </div>
  );
}