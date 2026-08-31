"use client";

import AccountPageShell from "../../../components/account/AccountPageShell";
import PageTitle from "../../../components/account/PageTitle";
import EmptyState from "../../../components/account/EmptyState";
import styles from "./page.module.css";

// Мокові списки бажань — тільки для наповнення макету. Реальні списки
// та товари в них підключить бекенд-команда (з іконками/фото товарів).
const mockWishlists = [
  {
    id: "main",
    title: "Подаруйте мені, будь ласка",
    isDefault: true,
    count: 6,
    items: ["/products/1.png", "/products/2.png", "/products/3.png", "/products/4.png", "/products/5.png", "/products/6.png"],
  },
  {
    id: "phone",
    title: "Для нового телефону",
    isDefault: false,
    count: 3,
    items: ["/products/7.png", "/products/8.png", "/products/9.png"],
  },
];

export default function WishlistPage() {
  return (
    <AccountPageShell>
      <div className={styles.headerRow}>
        <PageTitle>Списки бажань</PageTitle>
        <button type="button" className={styles.addButton} aria-label="Новий список">
          +
        </button>
      </div>

      {mockWishlists.length === 0 ? (
        <EmptyState
          icon="/icons/heart.svg"
          title="Списки бажань порожні"
          subtitle="Додавайте товари в обране прямо з каталогу, натиснувши на сердечко"
          actionLabel="Перейти в каталог"
        />
      ) : (
        <div className={styles.lists}>
          {mockWishlists.map((list) => (
            <section key={list.id} className={styles.listCard}>
              <div className={styles.listHeader}>
                <div>
                  <p className={styles.listTitle}>
                    {list.title}
                    {list.isDefault && <span className={styles.defaultTag}> (Основний)</span>}
                  </p>
                  <p className={styles.listCount}>Кількість товарів: {list.count}</p>
                </div>
                <div className={styles.listActions}>
                  <button type="button" className={styles.iconButton} aria-label="Поділитися">
                    <img src="/icons/telegram.svg" alt="" className={styles.actionIcon} />
                  </button>
                  <button type="button" className={styles.iconButton} aria-label="Ще">
                    ⋮
                  </button>
                </div>
              </div>
              <div className={styles.itemsRow}>
                {list.items.map((src, i) => (
                  <div key={i} className={styles.itemThumb}>
                    <img src={src} alt="" className={styles.itemImage} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </AccountPageShell>
  );
}