"use client";

import { useRouter } from "next/navigation";
import ProductCard from "../../../components/home/ProductCard";
import AccountPageShell from "../../../components/account/AccountPageShell";
import EmptyState from "../../../components/account/EmptyState";
import { clearViewedProducts } from "../../../lib/api/viewed";
import { useViewedProducts } from "../../../lib/useViewedProducts";
import styles from "./page.module.css";

export default function ViewedPage() {
  const router = useRouter();
  const viewed = useViewedProducts();

  return (
    <AccountPageShell>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Переглянуті товари</h1>
        {viewed.length > 0 && (
          <button type="button" className={styles.clearButton} onClick={clearViewedProducts}>
            Очистити всі
          </button>
        )}
      </div>

      {viewed.length === 0 ? (
        <EmptyState
          icon="/icons/eye.svg"
          title="Ви ще нічого не переглядали"
          subtitle="Товари, які ви переглядаєте в каталозі, з’являтимуться тут"
          actionLabel="Перейти до покупок"
          onAction={() => router.push("/")}
        />
      ) : (
        <div className={styles.grid}>
          {viewed.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
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
    </AccountPageShell>
  );
}