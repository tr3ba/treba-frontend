"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./SellerTabs.module.css";

type SellerTabsProps = {
  sellerId: string;
  productsCount: number;
  reviewsCount: number;
};

// Вкладки — отдельные адреса: /seller/[id], /seller/[id]/about, /seller/[id]/reviews
export default function SellerTabs({ sellerId, productsCount, reviewsCount }: SellerTabsProps) {
  const pathname = usePathname();
  const base = `/seller/${encodeURIComponent(sellerId)}`;

  const tabs = [
    { href: base, label: "Товари продавця", count: productsCount },
    { href: `${base}/about`, label: "Про продавця" },
    { href: `${base}/reviews`, label: "Відгуки", count: reviewsCount },
  ];

  return (
    <nav className={styles.tabs} aria-label="Розділи сторінки продавця">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
            aria-current={isActive ? "page" : undefined}
            scroll={false}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={styles.count}>{tab.count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}