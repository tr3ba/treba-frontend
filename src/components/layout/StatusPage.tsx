"use client";

import Link from "next/link";
import Header from "./Header";
import Footer from "../home/Footer";
import EmptyState from "../account/EmptyState";
import styles from "./StatusPage.module.css";

type StatusPageProps = {
  icon: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Технические детали — показываем только в режиме разработки */
  details?: string;
};

// Общий каркас для служебных страниц: ошибка, «не найдено» и т.п.
export default function StatusPage({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  details,
}: StatusPageProps) {
  const showDetails = process.env.NODE_ENV === "development" && Boolean(details);

  return (
    <>
      <Header />

      <main className={styles.page}>
        <div className={styles.content}>
          <EmptyState
            icon={icon}
            title={title}
            subtitle={subtitle}
            actionLabel={actionLabel}
            onAction={onAction}
          />

          <Link href="/" className={styles.homeLink}>
            Повернутися на головну
          </Link>

          {showDetails && <p className={styles.details}>{details}</p>}
        </div>
      </main>

      <Footer />
    </>
  );
}