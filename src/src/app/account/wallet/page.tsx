"use client";

import AccountPageShell from "../../../components/account/AccountPageShell";
import PageTitle from "../../../components/account/PageTitle";
import styles from "./page.module.css";

export default function WalletPage() {
  return (
    <AccountPageShell>
      <PageTitle>Гаманець</PageTitle>

      <button type="button" className={styles.addCard}>
        <span className={styles.plus}>+</span>
        Додати картку
      </button>
    </AccountPageShell>
  );
}