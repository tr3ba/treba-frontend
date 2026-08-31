"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Header from "../layout/Header";
import Footer from "../home/Footer";
import AccountSidebar from "./AccountSidebar";
import styles from "./AccountPageShell.module.css";

type AccountPageShellProps = {
  children: React.ReactNode;
};

// Спільний каркас для головної сторінки кабінету (/account) і всіх його розділів
export default function AccountPageShell({ children }: AccountPageShellProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
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
            <AccountSidebar />
          </div>

          <div className={styles.mainContent}>{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}