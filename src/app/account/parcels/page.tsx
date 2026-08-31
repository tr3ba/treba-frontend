"use client";

import AccountPageShell from "../../../components/account/AccountPageShell";
import PageTitle from "../../../components/account/PageTitle";
import InlineCheckRow from "../../../components/account/InlineCheckRow";
import styles from "./page.module.css";

export default function ParcelsPage() {
  return (
    <AccountPageShell>
      <PageTitle>Посилки</PageTitle>

      <div className={styles.trackBlock}>
        <p className={styles.trackLabel}>Відстежити посилку за номером</p>
        <InlineCheckRow placeholder="Введіть номер посилки" buttonLabel="Відстежити" />
      </div>

      <h2 className={styles.sectionTitle}>
        TREBA Delivery — зручний та надійний сервіс доставки ваших посилок
      </h2>

      <div className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <span className={styles.infoIconWrap}>
            <img src="/icons/shop.svg" alt="" className={styles.infoIcon} />
          </span>
          <div>
            <p className={styles.infoTitle}>Магазини TREBA по всій Україні</p>
            <p className={styles.infoText}>
              Ви можете обрати будь-яку зручну для вас точку доставки поруч із вами.
            </p>
          </div>
        </div>

        <div className={styles.infoCard}>
          <span className={styles.infoIconWrap}>
            <img src="/icons/delivery.svg" alt="" className={styles.infoIcon} />
          </span>
          <div>
            <p className={styles.infoTitle}>Найкращий сервіс</p>
            <p className={styles.infoText}>
              Електронні черги, можливість примірки, зручні зали очікування та приємний сервіс від наших співробітників.
            </p>
          </div>
        </div>
      </div>
    </AccountPageShell>
  );
}