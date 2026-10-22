"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SellerApplication } from "../../types/sellerApplication";
import SellSection from "./SellSection";
import SellApplicationForm from "./SellApplicationForm";
import { IconCheck } from "./SellIcons";
import styles from "./SellApply.module.css";
import { useAuth } from "../../context/AuthContext";
import { adminOrigin, canOpenAdmin, workspaceLabel } from "../../lib/admin";
import { getSellerApplication } from "../../lib/api/sellerApplication";

const PERKS = [
  "Безкоштовне підключення",
  "Відповідь протягом 3 робочих днів",
  "Допомога менеджера з першими товарами",
];

// Блок заявки на весь экран: слева описание, справа форма или экран успеха
export default function SellApply() {
  const [submitted, setSubmitted] = useState<SellerApplication | null>(null);
  const { user, isLoading } = useAuth();
  const userId = user?.id, role = user?.role;
  const [loadedFor, setLoadedFor] = useState("");
  const [loadError, setLoadError] = useState("");
  const [reapply, setReapply] = useState(false);
  useEffect(() => {
    if (!userId || canOpenAdmin(role)) return;
    let active = true;
    const load = () => getSellerApplication().then(application => { if (active) { setSubmitted(application); setLoadedFor(userId); setLoadError(""); } })
      .catch(error => { if (active) { setLoadError(error instanceof Error ? error.message : "Не вдалося перевірити заявку."); setLoadedFor(userId); } });
    void load(); const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [userId, role]);

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
          {isLoading || user && loadedFor !== user.id ? <p role="status">Перевіряємо обліковий запис…</p> : !user ? (
            <div className={styles.success}><h3 className={styles.successTitle}>Подайте заявку зі свого акаунта</h3>
              <p className={styles.successText}>Увійдіть як покупець, щоб надіслати заявку й відстежувати її розгляд.</p>
              <div className={styles.successActions}><Link href="/login?next=%2Fsell%23apply" className={styles.btnPrimary}>Увійти та подати заявку</Link></div></div>
          ) : loadError ? <div role="alert"><p>{loadError}</p><Link href="/login?next=%2Fsell%23apply" className={styles.btnPrimary}>Увійти знову</Link></div> : submitted && !reapply ? (
            <div className={styles.success} role="status">
              <span className={styles.successIcon}>
                <IconCheck size={40} />
              </span>
              <h3 className={styles.successTitle}>{submitted.status === "pending" ? "Заявка на розгляді" : submitted.status === "approved" ? "Заявку схвалено" : "Заявку відхилено"}</h3>
              <p className={styles.successText}>
                {submitted.status === "pending" ? "Заявку збережено. Менеджер перевірить дані вашого магазину." : submitted.status === "approved" ? "Магазин створено. Увійдіть знову, щоб відкрити кабінет продавця з новою роллю." : "Перевірте причину відмови та подайте виправлені дані."}
                {submitted.reviewNote && <><br /><strong>{submitted.reviewNote}</strong></>}
              </p>

              <div className={styles.successActions}>
                <Link href="/" className={styles.btnPrimary}>
                  Повернутися до магазину
                </Link>
                {submitted.status === "rejected" && <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setReapply(true)}
                >
                  Подати виправлену заявку
                </button>}
                {submitted.status === "approved" && <a href={adminOrigin + "/site-login/start"} className={styles.btnPrimary}>Відкрити кабінет продавця</a>}
              </div>
            </div>
          ) : (
            <SellApplicationForm onSubmitted={application => { setSubmitted(application); setReapply(false); }} />
          )}
        </div>
      </div>
    </SellSection>
  );
}
