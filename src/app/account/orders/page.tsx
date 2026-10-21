"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AccountPageShell from "../../../components/account/AccountPageShell";
import PageTitle from "../../../components/account/PageTitle";
import EmptyState from "../../../components/account/EmptyState";
import { getMyOrders, getOrderStatusLabel, isOrderInactive } from "../../../lib/api/orders";
import { formatDate } from "../../../lib/format";
import type { OrderSummary } from "../../../types/order";
import styles from "./page.module.css";
import Icon from "../../../components/common/Icon";

type Period = "all" | "year" | "month";

const PERIOD_DAYS: Record<Exclude<Period, "all">, number> = { year: 365, month: 30 };
const DAY_MS = 24 * 60 * 60 * 1000;

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<Period>("all");
  // Граница периода считается в момент выбора — не во время рендера
  const [since, setSince] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    getMyOrders()
      .then((list) => {
        if (active) setOrders(list);
      })
      .catch(() => {
        if (active) setOrders([]);
      });
    return () => {
      active = false;
    };
  }, []);

  function handlePeriodChange(value: Period) {
    setPeriod(value);
    setSince(value === "all" ? null : Date.now() - PERIOD_DAYS[value] * DAY_MS);
  }

  const visible = useMemo(() => {
    if (!orders) return [];
    const q = query.trim().toLowerCase();
    return orders.filter(
      (order) =>
        (!q || order.number.toLowerCase().includes(q)) &&
        (since === null || Date.parse(order.createdAt) >= since)
    );
  }, [orders, query, since]);

  return (
    <AccountPageShell>
      <PageTitle>Замовлення</PageTitle>

      {orders !== null && orders.length === 0 && (
        <EmptyState
          icon="/icons/box.svg"
          title="Замовлень ще немає"
          subtitle="Тут з’являться усі ваші замовлення після першої покупки"
          actionLabel="Перейти до покупок"
          onAction={() => router.push("/")}
        />
      )}

      {orders !== null && orders.length > 0 && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <svg
                className={styles.searchIcon}
                viewBox="0 0 20 20"
                width="18"
                height="18"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="9" cy="9" r="6" stroke="#898888" strokeWidth="1.6" />
                <path d="M17 17l-4-4" stroke="#898888" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Пошук за номером замовлення"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className={styles.periodSelect}
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value as Period)}
            >
              <option value="all">За весь час</option>
              <option value="year">За рік</option>
              <option value="month">За місяць</option>
            </select>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon="/icons/box.svg"
              title="Замовлень не знайдено"
              subtitle="Спробуйте змінити номер або період"
            />
          ) : (
            <div className={styles.list}>
              {visible.map((order) => {
                const inactive = isOrderInactive(order.status);
                return (
                  <div key={order.id} className={styles.orderRow}>
                    <div className={styles.orderInfo}>
                      <p
                        className={`${styles.orderNumber} ${inactive ? styles.orderNumberCancelled : ""}`}
                      >
                        № {order.number} від {formatDate(order.createdAt)}
                      </p>
                      <p
                        className={`${styles.orderStatus} ${
                          inactive ? styles.statusCancelled : styles.statusDone
                        }`}
                      >
                        {getOrderStatusLabel(order.status)}
                      </p>
                    </div>
                    {order.thumbnail ? (
                      <Image src={order.thumbnail} alt="" width={36} height={36} className={styles.orderThumb} />
                    ) : (
                      <Icon src="/icons/box.svg" className={styles.orderThumb} />
                    )}
                    <button type="button" className={styles.expandButton} aria-label="Деталі замовлення">
                      <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
                        <path
                          d="M4 6l4 4 4-4"
                          stroke="#28251d"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </AccountPageShell>
  );
}