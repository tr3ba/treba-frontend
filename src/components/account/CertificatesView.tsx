"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { formatDate, formatPrice } from "../../lib/format";
import {
  buyCertificate,
  checkCertificateCode,
  getCertificates,
  isCertificateExpired,
} from "../../lib/api/certificates";
import type { CertificatePurchaseInput, GiftCertificate } from "../../types/certificate";
import PageTitle from "./PageTitle";
import EmptyState from "./EmptyState";
import InlineCheckRow from "./InlineCheckRow";
import CertificateCard from "./CertificateCard";
import CertificatePurchaseForm from "./CertificatePurchaseForm";
import styles from "./CertificatesView.module.css";

type CheckResult = { type: "found"; certificate: GiftCertificate } | { type: "notFound" } | null;

// Розділ кабінету «Подарункові сертифікати»: перевірка коду, список, покупка
export default function CertificatesView() {
  const { user } = useAuth();
  const userId = user?.id;

  const [certificates, setCertificates] = useState<GiftCertificate[] | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult>(null);
  const [purchased, setPurchased] = useState<GiftCertificate | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getCertificates(userId).then((list) => {
      if (!cancelled) setCertificates(list);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // форма открылась — прокручиваем к ней
  useEffect(() => {
    if (isFormOpen) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isFormOpen]);

  // после покупки — показываем сообщение с кодом
  useEffect(() => {
    if (purchased) {
      successRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [purchased]);

  if (!userId) return null;
  const uid: string = userId;

  async function handleCheck(code: string) {
    const found = await checkCertificateCode(uid, code);
    setCheckResult(found ? { type: "found", certificate: found } : { type: "notFound" });
  }

  async function handleBuy(input: CertificatePurchaseInput) {
    // ошибка пробрасывается в форму
    const { certificate, list } = await buyCertificate(uid, input);
    setCertificates(list);
    setPurchased(certificate);
    setIsFormOpen(false);
  }

  function openForm() {
    setPurchased(null);
    setIsFormOpen(true);
  }

  return (
    <>
      <PageTitle>Подарункові сертифікати</PageTitle>

      <InlineCheckRow
        placeholder="Введіть код сертифіката"
        buttonLabel="Перевірити"
        onSubmit={(code) => void handleCheck(code)}
      />

      {checkResult?.type === "found" &&
        (isCertificateExpired(checkResult.certificate) ? (
          <p className={`${styles.notice} ${styles.noticeError}`} role="status">
            Термін дії сертифіката {checkResult.certificate.code} минув
          </p>
        ) : (
          <p className={`${styles.notice} ${styles.noticeSuccess}`} role="status">
            Сертифікат дійсний: {formatPrice(checkResult.certificate.amount)} ₴, до{" "}
            {formatDate(checkResult.certificate.validUntil)}
          </p>
        ))}

      {checkResult?.type === "notFound" && (
        <p className={`${styles.notice} ${styles.noticeError}`} role="status">
          Сертифікат з таким кодом не знайдено
        </p>
      )}

      {purchased && (
        <div ref={successRef} className={`${styles.notice} ${styles.noticeSuccess} ${styles.success}`} role="status">
          <span>
            Сертифікат на {formatPrice(purchased.amount)} ₴ придбано. Код: <strong>{purchased.code}</strong>
          </span>
          <button
            type="button"
            className={styles.noticeClose}
            onClick={() => setPurchased(null)}
            aria-label="Закрити повідомлення"
          >
            ×
          </button>
        </div>
      )}

      {certificates === null ? (
        <p className={styles.loading}>Завантаження…</p>
      ) : (
        <>
          {certificates.length === 0 && !isFormOpen && (
            <EmptyState
              icon="/icons/discount.svg"
              title="Сертифікатів немає"
              subtitle="Сертифікат TREBA — подарунок, який точно сподобається"
              actionLabel="Обрати та купити сертифікат"
              onAction={openForm}
            />
          )}

          {certificates.length > 0 && (
            <div className={styles.list}>
              {certificates.map((certificate) => (
                <CertificateCard key={certificate.id} certificate={certificate} />
              ))}

              {!isFormOpen && (
                <button type="button" className={styles.addButton} onClick={openForm}>
                  <span className={styles.plus} aria-hidden="true">
                    +
                  </span>
                  Купити сертифікат
                </button>
              )}
            </div>
          )}

          {isFormOpen && (
            <div ref={formRef} className={styles.formWrap}>
              <CertificatePurchaseForm onSubmit={handleBuy} onCancel={() => setIsFormOpen(false)} />
            </div>
          )}
        </>
      )}
    </>
  );
}