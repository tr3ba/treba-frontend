"use client";

import { useState, type KeyboardEvent } from "react";
import { applyCoupon, CouponError } from "../../lib/api/promotions";
import { formatPrice } from "../../lib/format";
import type { AppliedCoupon, CouponItem } from "../../types/promotion";
import styles from "./PromoCode.module.css";

type PromoCodeProps = {
  items: CouponItem[];
  applied: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: () => void;
  disabled?: boolean;
};

// Блок «Промокод» у підсумку: посилання → поле + «Застосувати» → застосований код
export default function PromoCode({ items, applied, onApply, onRemove, disabled = false }: PromoCodeProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleApply() {
    if (loading || disabled) return;
    setLoading(true);
    setError("");
    try {
      const coupon = await applyCoupon(value, items);
      onApply(coupon);
      setValue("");
      setOpen(false);
    } catch (reason) {
      setError(reason instanceof CouponError ? reason.message : "Не вдалося перевірити промокод. Спробуйте пізніше.");
    } finally {
      setLoading(false);
    }
  }

  // Enter внутри формы оформления отправил бы заказ — применяем промокод
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleApply();
    }
    if (event.key === "Escape") {
      setOpen(false);
      setError("");
    }
  }

  if (applied) {
    return (
      <div className={styles.applied}>
        <div className={styles.appliedInfo}>
          <span className={styles.appliedLabel}>Промокод</span>
          <span className={styles.code}>{applied.code}</span>
          <span className={styles.appliedNote}>
            {applied.discount > 0 ? `Знижка ${formatPrice(applied.discount)} ₴` : ""}
            {applied.discount > 0 && applied.freeDelivery ? " · " : ""}
            {applied.freeDelivery ? "Безкоштовна доставка" : ""}
          </span>
        </div>
        <button type="button" className={styles.link} onClick={onRemove} disabled={disabled}>
          Видалити
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className={`${styles.link} ${styles.add}`} onClick={() => setOpen(true)} disabled={disabled}>
        <span className={styles.plus} aria-hidden="true">+</span>
        Додати промокод
      </button>
    );
  }

  return (
    <div className={styles.field}>
      <label htmlFor="checkout-coupon" className={styles.label}>
        Промокод
      </label>
      <div className={styles.controls}>
        <input
          id="checkout-coupon"
          className={`${styles.input} ${error ? styles.inputError : ""}`}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError("");
          }}
          onKeyDown={handleKeyDown}
          placeholder="Введіть код"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={100}
          autoFocus
          disabled={loading || disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "checkout-coupon-error" : undefined}
        />
        <button
          type="button"
          className={styles.apply}
          onClick={() => void handleApply()}
          disabled={loading || disabled || !value.trim()}
        >
          {loading ? "Перевіряємо…" : "Застосувати"}
        </button>
      </div>
      {error && (
        <p id="checkout-coupon-error" className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className={`${styles.link} ${styles.cancel}`}
        onClick={() => {
          setOpen(false);
          setValue("");
          setError("");
        }}
      >
        Скасувати
      </button>
    </div>
  );
}