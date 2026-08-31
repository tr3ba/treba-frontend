"use client";

import ProductCard from "../../../components/home/ProductCard";
import AccountPageShell from "../../../components/account/AccountPageShell";
import EmptyState from "../../../components/account/EmptyState";
import styles from "./page.module.css";

// Мокові товари — беру ті самі картки, що й на головній
const mockViewed = [
  { id: "1", title: "Зволожувач повітря LEVOIT Dual 200S Smart Top-Fill...", price: "12 999", oldPrice: "14 799", image: "/products/1.png", rating: 4.5, isPromo: true },
  { id: "2", title: "Засіб лужний гелевий SEPTI WELL Микола...", price: "187", image: "/products/2.png", rating: 4.2 },
  { id: "3", title: "Рушники паперові Сніжна Панда Salad Greens 2...", price: "75", oldPrice: "90", image: "/products/3.png", rating: 4.5, isPromo: true },
  { id: "4", title: "Бактерії для септиків, вигрібних ям та компосту...", price: "799", image: "/products/4.png", rating: 4.4 },
  { id: "5", title: "Мультипіч NINJA Foodi Dual Zone Max AF400EUWH...", price: "12 999", oldPrice: "18 799", image: "/products/5.png", rating: 4.6, isPromo: true },
  { id: "6", title: "Крісло-качалка LUARO KV7630 чорна...", price: "999", oldPrice: "1 090", image: "/products/6.png", rating: 4.1, isPromo: true },
];
export default function ViewedPage() {
  return (
    <AccountPageShell>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Переглянуті товари</h1>
        {mockViewed.length > 0 && (
          <button type="button" className={styles.clearButton}>
            Очистити всі
          </button>
        )}
      </div>

      {mockViewed.length === 0 ? (
        <EmptyState
          icon="/icons/track.svg"
          title="Ви ще нічого не переглядали"
          subtitle="Товари, які ви переглядаєте в каталозі, з’являтимуться тут"
          actionLabel="Перейти в каталог"
        />
      ) : (
        <div className={styles.grid}>
          {mockViewed.map((item) => (
  <ProductCard key={item.id} {...item} />
))}
        </div>
      )}
    </AccountPageShell>
  );
}