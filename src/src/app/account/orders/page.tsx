"use client";

import { useState } from "react";
import AccountPageShell from "../../../components/account/AccountPageShell";
import PageTitle from "../../../components/account/PageTitle";
import EmptyState from "../../../components/account/EmptyState";
import styles from "./page.module.css";

// Мокові замовлення — просто для візуального наповнення сторінки
const mockOrders = [
  {
    id: "864483246",
    date: "21 вересня 2026",
    status: "done" as const,
    icon: "/icons/box.svg",
  },
  {
    id: "857273822",
    date: "15 липня 2026",
    status: "cancelled" as const,
    icon: "/icons/box.svg",
  },
  {
    id: "841382657",
    date: "11 лютого 2026",
    status: "done" as const,
    icon: "/icons/laptop.svg",
  },
  {
    id: "798640038",
    date: "11 січня 2026",
    status: "done" as const,
    icon: "/icons/clothes.svg",
  },
];

const statusLabel: Record<string, string> = {
  done: "Виконано",
  cancelled: "Скасовано користувачем",
};

export default function OrdersPage() {
  const [query, setQuery] = useState("");

  return (
    <AccountPageShell>
      <PageTitle>Замовлення</PageTitle>

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
            placeholder="Пошук товару або замовлення"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className={styles.periodSelect} defaultValue="all">
          <option value="all">За весь час</option>
          <option value="year">За рік</option>
          <option value="month">За місяць</option>
        </select>
      </div>

      {mockOrders.length === 0 ? (
        <EmptyState
          icon="/icons/box.svg"
          title="Замовлень ще немає"
          subtitle="Тут з’являться усі ваші замовлення після першої покупки"
        />
      ) : (
        <div className={styles.list}>
          {mockOrders.map((order) => (
            <div key={order.id} className={styles.orderRow}>
              <div className={styles.orderInfo}>
                <p
                  className={`${styles.orderNumber} ${
                    order.status === "cancelled" ? styles.orderNumberCancelled : ""
                  }`}
                >
                  № {order.id} від {order.date}
                </p>
                <p
                  className={`${styles.orderStatus} ${
                    order.status === "cancelled" ? styles.statusCancelled : styles.statusDone
                  }`}
                >
                  {statusLabel[order.status]}
                </p>
              </div>
              <img src={order.icon} alt="" className={styles.orderThumb} />
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
          ))}
        </div>
      )}
    </AccountPageShell>
  );
}