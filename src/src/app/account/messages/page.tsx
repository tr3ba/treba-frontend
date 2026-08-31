"use client";

import { useState } from "react";
import AccountPageShell from "../../../components/account/AccountPageShell";
import PageTitle from "../../../components/account/PageTitle";
import styles from "./page.module.css";

// Мокові треди — тільки для візуального наповнення
const mockThreads = [
  { id: "treba-chat", name: "TREBA", preview: "Чат з підтримкою", date: "" },
  { id: "treba-tracking", name: "TREBA", preview: "Трекінг замовлення", date: "26.08.2026" },
];

export default function MessagesPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeThread = mockThreads.find((t) => t.id === activeId) ?? null;

  return (
    <AccountPageShell>
      <PageTitle>Листування з продавцями</PageTitle>

      <div className={styles.chatWrap}>
        <aside className={styles.threadList}>
          {mockThreads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              className={`${styles.threadItem} ${
                activeId === thread.id ? styles.threadItemActive : ""
              }`}
              onClick={() => setActiveId(thread.id)}
            >
              <span className={styles.threadAvatar}>
                <img src="/logo/MainLogo.svg" alt="" className={styles.threadAvatarImg} />
              </span>
              <span className={styles.threadTextWrap}>
                <span className={styles.threadTopRow}>
                  <span className={styles.threadName}>{thread.name}</span>
                  {thread.date && <span className={styles.threadDate}>{thread.date}</span>}
                </span>
                <span className={styles.threadPreview}>{thread.preview}</span>
              </span>
            </button>
          ))}
        </aside>

        <section className={styles.chatPanel}>
          {activeThread ? (
            <div className={styles.chatPlaceholderInner}>
              <p className={styles.chatPlaceholderTitle}>{activeThread.name}</p>
              <p className={styles.chatPlaceholderText}>
                Тут з’явиться історія повідомлень цієї переписки.
              </p>
            </div>
          ) : (
            <p className={styles.chatPlaceholderText}>Виберіть переписку, щоб почати спілкування</p>
          )}
        </section>
      </div>
    </AccountPageShell>
  );
}