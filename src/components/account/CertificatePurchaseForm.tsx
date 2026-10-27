"use client";

import { useState, type FormEvent } from "react";
import { formatPrice } from "../../lib/format";
import {
  CERTIFICATE_MAX_AMOUNT,
  CERTIFICATE_MIN_AMOUNT,
  CERTIFICATE_PRESETS,
} from "../../lib/api/certificates";
import type { CertificatePurchaseInput } from "../../types/certificate";
import styles from "./CertificatePurchaseForm.module.css";

type CertificatePurchaseFormProps = {
  onSubmit: (input: CertificatePurchaseInput) => Promise<void>;
  onCancel: () => void;
};

/** Плитка-номинал или «Інша сума» */
type Selection = number | "custom";

const MESSAGE_MAX_LENGTH = 150;

function isValidAmount(value: number): boolean {
  return Number.isInteger(value) && value >= CERTIFICATE_MIN_AMOUNT && value <= CERTIFICATE_MAX_AMOUNT;
}

// Форма «Обрати та купити сертифікат»: номінал, своя сума, отримувач, привітання
export default function CertificatePurchaseForm({ onSubmit, onCancel }: CertificatePurchaseFormProps) {
  const [selection, setSelection] = useState<Selection>(500);
  const [customValue, setCustomValue] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const amount = selection === "custom" ? Number(customValue) : selection;
  const amountIsValid = isValidAmount(amount);
  const customError =
    isSubmitted && selection === "custom" && !amountIsValid
      ? `Від ${formatPrice(CERTIFICATE_MIN_AMOUNT)} до ${formatPrice(CERTIFICATE_MAX_AMOUNT)} ₴`
      : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitted(true);
    setSubmitError(null);

    if (!amountIsValid) return;

    setIsSaving(true);
    try {
      await onSubmit({ amount, recipientName, message });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Не вдалося купити сертифікат");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.title}>Подарунковий сертифікат</h2>

      {/* ---------- номинал ---------- */}
      <div className={styles.group}>
        <span className={styles.label}>Номінал</span>
        <div className={styles.amounts}>
          {CERTIFICATE_PRESETS.map((value) => (
            <button
              key={value}
              type="button"
              className={`${styles.amount} ${selection === value ? styles.amountActive : ""}`}
              aria-pressed={selection === value}
              onClick={() => setSelection(value)}
            >
              {formatPrice(value)} ₴
            </button>
          ))}
          <button
            type="button"
            className={`${styles.amount} ${styles.amountCustom} ${selection === "custom" ? styles.amountActive : ""}`}
            aria-pressed={selection === "custom"}
            onClick={() => setSelection("custom")}
          >
            Інша сума
          </button>
        </div>

        {selection === "custom" && (
          <label className={styles.field}>
            <span className={styles.label}>Ваша сума</span>
            <div className={styles.inputWithSuffix}>
              <input
                className={`${styles.input} ${customError ? styles.inputError : ""}`}
                value={customValue}
                onChange={(event) => setCustomValue(event.target.value.replace(/\D/g, "").slice(0, 5))}
                inputMode="numeric"
                placeholder={`${CERTIFICATE_MIN_AMOUNT} – ${formatPrice(CERTIFICATE_MAX_AMOUNT)}`}
                autoFocus
              />
              <span className={styles.suffix}>₴</span>
            </div>
            {customError && <span className={styles.error}>{customError}</span>}
          </label>
        )}
      </div>

      {/* ---------- для кого ---------- */}
      <div className={styles.group}>
        <label className={styles.field}>
          <span className={styles.label}>
            Ім&apos;я отримувача <span className={styles.optional}>(необов&apos;язково)</span>
          </span>
          <input
            className={styles.input}
            value={recipientName}
            onChange={(event) => setRecipientName(event.target.value)}
            placeholder="Наприклад, Олена"
            maxLength={40}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>
            Привітання <span className={styles.optional}>(необов&apos;язково)</span>
          </span>
          <textarea
            className={styles.textarea}
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, MESSAGE_MAX_LENGTH))}
            placeholder="З днем народження!"
            rows={3}
          />
          <span className={styles.counter}>
            {message.length}/{MESSAGE_MAX_LENGTH}
          </span>
        </label>
      </div>

      <p className={styles.note}>Сертифікат діє 12 місяців. Демо-режим: оплата не списується.</p>

      {submitError && (
        <p className={styles.submitError} role="alert">
          {submitError}
        </p>
      )}

      <div className={styles.buttons}>
        <button type="submit" className={styles.buyButton} disabled={isSaving}>
          {isSaving ? "Оформлення…" : amountIsValid ? `Купити за ${formatPrice(amount)} ₴` : "Купити"}
        </button>
        <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={isSaving}>
          Скасувати
        </button>
      </div>
    </form>
  );
}