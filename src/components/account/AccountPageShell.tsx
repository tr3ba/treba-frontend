"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Header from "../layout/Header";
import Footer from "../home/Footer";
import AccountSidebar, { type AccountNavItem } from "./AccountSidebar";
import styles from "./AccountPageShell.module.css";

type AccountPageShellProps = {
  children: React.ReactNode;
  /** Свої пункти меню (напр. кабінет продавця); без пропа — меню покупця */
  navItems?: AccountNavItem[];
  toggleHint?: string;
  navLabel?: string;
};

// Спільний каркас кабінетів: покупця (/account) і продавця (/seller)
export default function AccountPageShell({
  children,
  navItems,
  toggleHint,
  navLabel,
}: AccountPageShellProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login?next=" + encodeURIComponent(window.location.pathname + window.location.search));
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <main className={styles.page}>
        <Header />
      </main>
    );
  }

  return (
    <>
      <main className={styles.page}>
        <Header />

        <div className={styles.pageContent}>
          <div className={styles.leftColumn}>
            <AccountSidebar items={navItems} toggleHint={toggleHint} navLabel={navLabel} />
          </div>

          <div className={styles.mainContent}>{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
