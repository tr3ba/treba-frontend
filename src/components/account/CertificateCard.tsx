"use client";

import { useState } from "react";
import { formatDate, formatPrice } from "../../lib/format";
import { isCertificateExpired } from "../../lib/api/certificates";
import type { GiftCertificate } from "../../types/certificate";
import styles from "./CertificateCard.module.css";

type CertificateCardProps = {
  certificate: GiftCertificate;
};

type CopyState = "idle" | "copied" | "failed";

// Подарунковий сертифікат: номінал, код з кнопкою копіювання, для кого, термін дії
export default function CertificateCard({ certificate }: CertificateCardProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const isExpired = isCertificateExpired(certificate);

  async function handleCopy() {
    try {
      // буфер обмена доступен только на https или localhost
      await navigator.clipboard.writeText(certificate.code);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 2000);
  }

  const copyLabel =
    copyState === "copied" ? "Скопійовано" : copyState === "failed" ? "Виділіть код" : "Копіювати";

  return (
    <article className={`${styles.card} ${isExpired ? styles.cardExpired : ""}`}>
      <div className={styles.top}>
        <div className={styles.topRow}>
          <span className={styles.caption}>Подарунковий сертифікат</span>
          <span className={styles.brand}>TREBA</span>
        </div>
        <p className={styles.amount}>{formatPrice(certificate.amount)} ₴</p>
      </div>

      <div className={styles.body}>
        <div className={styles.codeRow}>
          <span className={styles.code}>{certificate.code}</span>
          <button
            type="button"
            className={`${styles.copyButton} ${copyState === "copied" ? styles.copyButtonDone : ""}`}
            onClick={handleCopy}
          >
            {copyLabel}
          </button>
        </div>

        {certificate.recipientName && (
          <p className={styles.meta}>
            Для: <strong>{certificate.recipientName}</strong>
          </p>
        )}

        {certificate.message && <p className={styles.message}>«{certificate.message}»</p>}

        <p className={`${styles.validity} ${isExpired ? styles.validityExpired : ""}`}>
          {isExpired ? "Термін дії минув" : `Дійсний до ${formatDate(certificate.validUntil)}`}
        </p>
      </div>
    </article>
  );
}