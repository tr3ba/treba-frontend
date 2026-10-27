"use client";

import { useState, type FormEvent } from "react";
import type { NewCardInput } from "../../types/wallet";
import styles from "./AddCardForm.module.css";

type AddCardFormProps = {
  /** Сохранение; ошибка (throw) показывается внизу формы */
  onSubmit: (input: NewCardInput) => Promise<void>;
  onCancel: () => void;
};

type FieldErrors = Partial<Record<"number" | "expiry" | "cvv" | "holder", string>>;

// "1234567812345678" -> "1234 5678 1234 5678"
function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

// "0528" -> "05/28"
function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

// Алгоритм Луна — так банки отсекают опечатки в номере
function passesLuhn(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    let n = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

function validate(number: string, expiry: string, cvv: string, holder: string): FieldErrors {
  const errors: FieldErrors = {};

  const digits = number.replace(/\D/g, "");
  if (digits.length !== 16 || !passesLuhn(digits)) {
    errors.number = "Перевірте номер картки";
  }

  const [mm, yy] = expiry.split("/");
  const month = Number(mm);
  if (!mm || !yy || yy.length !== 2 || month < 1 || month > 12) {
    errors.expiry = "Формат ММ/РР";
  } else {
    const now = new Date();
    const year = 2000 + Number(yy);
    // картка дійсна до кінця вказаного місяця
    const isExpired = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
    if (isExpired) errors.expiry = "Термін дії минув";
  }

  if (!/^\d{3}$/.test(cvv)) {
    errors.cvv = "3 цифри";
  }

  if (!/^[A-Za-z][A-Za-z '-]+$/.test(holder.trim())) {
    errors.holder = "Латиницею, як на картці";
  }

  return errors;
}

// Форма «Нова картка». CVV проверяется, но никуда не передаётся и не сохраняется.
export default function AddCardForm({ onSubmit, onCancel }: AddCardFormProps) {
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [holder, setHolder] = useState("");
  // ошибки показываем после первой попытки сохранить, дальше — обновляются по мере ввода
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = isSubmitted ? validate(number, expiry, cvv, holder) : {};

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitted(true);
    setSubmitError(null);

    if (Object.keys(validate(number, expiry, cvv, holder)).length > 0) return;

    const [expMonth, expYear] = expiry.split("/");
    setIsSaving(true);
    try {
      await onSubmit({ number: number.replace(/\D/g, ""), holder, expMonth, expYear });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Не вдалося зберегти картку");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.title}>Нова картка</h2>

      <label className={styles.field}>
        <span className={styles.label}>Номер картки</span>
        <input
          className={`${styles.input} ${errors.number ? styles.inputError : ""}`}
          value={number}
          onChange={(event) => setNumber(formatCardNumber(event.target.value))}
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
          maxLength={19}
        />
        {errors.number && <span className={styles.error}>{errors.number}</span>}
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Термін дії</span>
          <input
            className={`${styles.input} ${errors.expiry ? styles.inputError : ""}`}
            value={expiry}
            onChange={(event) => setExpiry(formatExpiry(event.target.value))}
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="ММ/РР"
            maxLength={5}
          />
          {errors.expiry && <span className={styles.error}>{errors.expiry}</span>}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>CVV</span>
          <input
            className={`${styles.input} ${errors.cvv ? styles.inputError : ""}`}
            value={cvv}
            onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 3))}
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="•••"
            maxLength={3}
          />
          {errors.cvv && <span className={styles.error}>{errors.cvv}</span>}
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Ім&apos;я власника</span>
        <input
          className={`${styles.input} ${errors.holder ? styles.inputError : ""}`}
          value={holder}
          onChange={(event) => setHolder(event.target.value.toUpperCase())}
          autoComplete="cc-name"
          autoCapitalize="characters"
          placeholder="IVAN PETRENKO"
          maxLength={40}
        />
        {errors.holder && <span className={styles.error}>{errors.holder}</span>}
      </label>

      <p className={styles.note}>Повний номер картки та CVV не зберігаються — лише останні 4 цифри.</p>

      {submitError && (
        <p className={styles.submitError} role="alert">
          {submitError}
        </p>
      )}

      <div className={styles.buttons}>
        <button type="submit" className={styles.saveButton} disabled={isSaving}>
          {isSaving ? "Збереження…" : "Зберегти картку"}
        </button>
        <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={isSaving}>
          Скасувати
        </button>
      </div>
    </form>
  );
}