"use client";

import { useState } from "react";
import Link from "next/link";
import type { SellerApplication } from "../../types/sellerApplication";
import SellSection from "./SellSection";
import SellApplicationForm from "./SellApplicationForm";
import { IconCheck } from "./SellIcons";
import styles from "./SellApply.module.css";
import { useAuth } from "../../context/AuthContext";
import { adminOrigin, canOpenAdmin, workspaceLabel } from "../../lib/admin";

const PERKS = [
  "Безкоштовне підключення",
  "Відповідь протягом 3 робочих днів",
  "Допомога менеджера з першими товарами",
];

// Блок заявки на весь экран: слева описание, справа форма или экран успеха
export default function SellApply() {
  const [submitted, setSubmitted] = useState<SellerApplication | null>(null);
  const { user, isLoading } = useAuth();

  if (user && canOpenAdmin(user.role)) return (
    <SellSection id="apply" ariaLabel="Робочий кабінет" className={styles.section}>
      <div className={styles.card}>
        <h2 className={styles.successTitle}>{workspaceLabel(user.role)}</h2>
        <p className={styles.successText}>{user.role === "Seller"
          ? "У вас уже є доступ до кабінету продавця. Керуйте товарами та замовленнями у своїй панелі."
          : "Це обліковий запис співробітника TREBA. Заявка продавця призначена для покупців; робочі інструменти доступні у вашій панелі."}</p>
        <div className={styles.successActions}>
          <a href={adminOrigin + "/site-login/start"} className={styles.btnPrimary}>{workspaceLabel(user.role)} ↗</a>
          <Link href="/" className={styles.btnSecondary}>До магазину</Link>
        </div>
      </div>
    </SellSection>
  );

  return (
    <SellSection
      id="apply"
      ariaLabel="Заявка на підключення"
      fullscreen
      className={styles.section}
    >
      <div className={styles.layout}>
        <div className={styles.pitch}>
          <span className={styles.eyebrow}>Заявка</span>
          <h2 className={styles.title}>Почніть продавати вже цього тижня</h2>
          <p className={styles.text}>
            Залиште заявку — менеджер зв&apos;яжеться з вами, допоможе з підключенням і
            відкриє доступ до панелі керування.
          </p>

          <ul className={styles.perks}>
            {PERKS.map((perk) => (
              <li key={perk} className={styles.perk}>
                <span className={styles.perkIcon}>
                  <IconCheck size={16} />
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.card}>
          {isLoading ? <p role="status">Перевіряємо обліковий запис…</p> : submitted ? (
            <div className={styles.success} role="status">
              <span className={styles.successIcon}>
                <IconCheck size={40} />
              </span>
              <h3 className={styles.successTitle}>Дякуємо! Заявку надіслано</h3>
              <p className={styles.successText}>
                Менеджер зв&apos;яжеться з вами протягом 3 робочих днів — за номером{" "}
                <strong>{submitted.phone}</strong> або на <strong>{submitted.email}</strong>.
              </p>

              <div className={styles.successActions}>
                <Link href="/" className={styles.btnPrimary}>
                  Повернутися до магазину
                </Link>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setSubmitted(null)}
                >
                  Надіслати ще одну заявку
                </button>
              </div>
            </div>
          ) : (
            <SellApplicationForm onSubmitted={setSubmitted} />
          )}
        </div>
      </div>
    </SellSection>
  );
}
