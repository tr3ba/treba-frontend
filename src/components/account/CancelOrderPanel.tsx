"use client";

import { useId, useState, type FormEvent } from "react";
import {
  CANCEL_REASONS,
  CANCEL_REASON_MAX_LENGTH,
  OTHER_CANCEL_REASON,
  cancelOrder,
  OrderError,
} from "../../lib/api/orders";
import styles from "./CancelOrderPanel.module.css";

type Props = {
  orderId: string;
  /** Вызывается после успешной отмены — страница перезагружает заказ */
  onCancelled: () => void;
};

// Кнопка «Скасувати замовлення» + раскрывающаяся форма с выбором причины.
// Показывать только для статусов, где отмена разрешена (canCancelOrder).
export default function CancelOrderPanel({ orderId, onCancelled }: Props) {
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [otherText, setOtherText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isOther = reason === OTHER_CANCEL_REASON;
  const finalReason = isOther ? otherText.trim() : reason;
  const canSubmit = finalReason.length > 0 && !isSubmitting;

  function close() {
    setIsOpen(false);
    setReason("");
    setOtherText("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError("");
    try {
      await cancelOrder(orderId, finalReason);
      onCancelled();
    } catch (caught) {
      setError(caught instanceof OrderError ? caught.message : "Не вдалося скасувати замовлення. Спробуйте ще раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <button type="button" className={styles.openButton} onClick={() => setIsOpen(true)}>
        Скасувати замовлення
      </button>
    );
  }

  return (
    <form className={styles.panel} onSubmit={handleSubmit} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        Скасувати замовлення?
      </h2>
      <p className={styles.text}>Замовлення буде скасовано без можливості відновлення, а товари повернуться в продаж.</p>

      <fieldset className={styles.reasons} disabled={isSubmitting}>
        <legend className={styles.legend}>Причина скасування</legend>
        {CANCEL_REASONS.map((item) => (
          <label key={item} className={styles.reason}>
            <input
              type="radio"
              name="cancel-reason"
              value={item}
              checked={reason === item}
              onChange={() => setReason(item)}
              className={styles.radio}
            />
            <span>{item}</span>
          </label>
        ))}
      </fieldset>

      {isOther && (
        <label className={styles.otherField}>
          <span className={styles.legend}>Опишіть причину</span>
          <textarea
            className={styles.textarea}
            value={otherText}
            onChange={(event) => setOtherText(event.target.value)}
            maxLength={CANCEL_REASON_MAX_LENGTH}
            rows={3}
            disabled={isSubmitting}
            autoFocus
          />
          <span className={styles.counter}>
            {otherText.length} / {CANCEL_REASON_MAX_LENGTH}
          </span>
        </label>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <button type="submit" className={styles.confirmButton} disabled={!canSubmit}>
          {isSubmitting ? "Скасовуємо…" : "Скасувати замовлення"}
        </button>
        <button type="button" className={styles.backButton} onClick={close} disabled={isSubmitting}>
          Не скасовувати
        </button>
      </div>
    </form>
  );
}