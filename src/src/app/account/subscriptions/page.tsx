"use client";

import { useState } from "react";
import AccountPageShell from "../../../components/account/AccountPageShell";
import PageTitle from "../../../components/account/PageTitle";
import styles from "./page.module.css";

type ToggleItem = {
  key: string;
  label: string;
  description?: string;
};

const newsletterTypes: ToggleItem[] = [
  {
    key: "surveys",
    label: "Опитування",
    description: "Отримуйте запрошення для участі в опитуваннях, консультаціях і тестуванні інструментів.",
  },
  {
    key: "news",
    label: "Новини TREBA",
    description: "Новини компанії та пропозиції співпраці.",
  },
  {
    key: "marketing",
    label: "Маркетингові пропозиції",
    description:
      "Періодично ми проводимо маркетингові активності та акції зі знижками, розіграшами, промокодами та іншими інструментами.",
  },
  {
    key: "recommendations",
    label: "Рекомендації на основі клієнтського досвіду",
    description: "Формуємо персональні, своєчасні та вигідні пропозиції для підписника.",
  },
];

const channels: ToggleItem[] = [
  { key: "email", label: "Email-листи" },
  { key: "viber", label: "Повідомлення у Viber" },
  { key: "sms", label: "SMS-повідомлення" },
  { key: "app", label: "Сповіщення у мобільному додатку" },
  { key: "browser", label: "Сповіщення у веб-браузері" },
];

export default function SubscriptionsPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      [...newsletterTypes, ...channels].map((item) => [item.key, true])
    )
  );

  function toggle(key: string) {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <AccountPageShell>
      <PageTitle>Підписки</PageTitle>

      <div className={styles.card}>
        <div className={styles.column}>
          <p className={styles.columnTitle}>Види розсилок</p>
          {newsletterTypes.map((item) => (
            <label key={item.key} className={styles.toggleRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={enabled[item.key]}
                onChange={() => toggle(item.key)}
              />
              <span>
                <span className={styles.toggleLabel}>{item.label}</span>
                {item.description && (
                  <span className={styles.toggleDescription}>{item.description}</span>
                )}
              </span>
            </label>
          ))}
        </div>

        <div className={styles.column}>
          <p className={styles.columnTitle}>Канали зв&apos;язку</p>
          {channels.map((item) => (
            <label key={item.key} className={styles.toggleRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={enabled[item.key]}
                onChange={() => toggle(item.key)}
              />
              <span className={styles.toggleLabel}>{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </AccountPageShell>
  );
}