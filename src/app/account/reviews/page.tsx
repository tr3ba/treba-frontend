"use client";

import { useEffect, useState } from "react";
import AccountPageShell from "../../../components/account/AccountPageShell";
import PageTitle from "../../../components/account/PageTitle";
import EmptyState from "../../../components/account/EmptyState";
import { getProductsAwaitingReview } from "../../../lib/api/reviews";
import type { ReviewableProduct } from "../../../types/review";
import styles from "./page.module.css";

type Tab = "products" | "seller";
type Filter = "waiting" | "mine";

export default function ReviewsPage() {
  const [tab, setTab] = useState<Tab>("products");
  const [filter, setFilter] = useState<Filter>("waiting");
  const [waiting, setWaiting] = useState<ReviewableProduct[]>([]);

  useEffect(() => {
    let active = true;
    getProductsAwaitingReview()
      .then((list) => {
        if (active) setWaiting(list);
      })
      .catch(() => {
        // не загрузили — остаётся пустой список
      });
    return () => {
      active = false;
    };
  }, []);

  // «Мої відгуки» — эндпоинта на бэке пока нет
  const items = filter === "waiting" ? waiting : [];

  return (
    <AccountPageShell>
      <PageTitle>Відгуки</PageTitle>

      <div className={styles.banner}>
        <img src="/icons/star.svg" alt="" className={styles.bannerIcon} />
        <div>
          <p className={styles.bannerTitle}>Поділіться своїм відгуком та допоможіть іншим!</p>
          <p className={styles.bannerText}>
            Залиште свій відгук про товар, щоб допомогти іншим користувачам зробити правильний вибір
          </p>
        </div>
      </div>

      <div className={styles.tabsRow}>
        <button
          type="button"
          className={`${styles.tab} ${tab === "products" ? styles.tabActive : ""}`}
          onClick={() => setTab("products")}
        >
          Про товари
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === "seller" ? styles.tabActive : ""}`}
          onClick={() => setTab("seller")}
        >
          Про продавця
        </button>
      </div>

      {tab === "products" && (
        <>
          <div className={styles.pillsRow}>
            <button
              type="button"
              className={`${styles.pill} ${filter === "waiting" ? styles.pillActive : ""}`}
              onClick={() => setFilter("waiting")}
            >
              Чекають відгуків
            </button>
            <button
              type="button"
              className={`${styles.pill} ${filter === "mine" ? styles.pillActive : ""}`}
              onClick={() => setFilter("mine")}
            >
              Мої відгуки
            </button>
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon="/icons/star.svg"
              title={filter === "mine" ? "Ви ще не залишали відгуків" : "Немає товарів, що очікують відгук"}
              subtitle={
                filter === "mine"
                  ? "Тут з’являться ваші відгуки про товари"
                  : "Після покупки ви зможете залишити відгук про товар тут"
              }
            />
          ) : (
            <div className={styles.list}>
              {items.map((item) => (
                <div key={item.id} className={styles.row}>
                  <img src={item.image ?? "/icons/box.svg"} alt="" className={styles.thumb} />
                  <p className={styles.itemTitle}>{item.title}</p>
                  <button type="button" className={styles.reviewButton}>
                    Залишити відгук
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "seller" && (
        <EmptyState
          icon="/icons/star.svg"
          title="Немає відгуків про продавців"
          subtitle="Тут з’являться ваші відгуки про продавців після покупки"
        />
      )}
    </AccountPageShell>
  );
}