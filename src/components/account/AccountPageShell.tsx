"use client";

import { useEffect } from "react";
import { getAccountLoginHref } from "../../lib/redirect";
import { useAuth } from "../../context/AuthContext";
import { canUseCustomerAccount } from "../../lib/admin";
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

  useEffect(() => {
    if (!isLoading && (!user || !canUseCustomerAccount(user.role))) {
      const href = getAccountLoginHref(window.location.pathname + window.location.search + window.location.hash);
      // Leave the protected tree completely so Next does not retain it behind an intercepted modal.
      if (href) window.location.replace(href);
    }
  }, [isLoading, user]);

  if (isLoading || !user || !canUseCustomerAccount(user.role)) {
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
