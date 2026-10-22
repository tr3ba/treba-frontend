"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { submitSellerApplication } from "../../lib/api/sellerApplication";
import type { SellerApplication, WebsiteProtocol } from "../../types/sellerApplication";
import { IconArrowRight, IconCheck } from "./SellIcons";
import styles from "./SellApplicationForm.module.css";
import { useAuth } from "../../context/AuthContext";

type Step = 1 | 2;

type FormValues = {
  companyName: string;
  storeName: string;
  taxNumber: string;
  protocol: WebsiteProtocol;
  domain: string;
  noWebsite: boolean;
  contactName: string;
  position: string;
  email: string;
  phone: string;
  isNonResident: boolean;
  consent: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  companyName: "",
  storeName: "",
  taxNumber: "",
  protocol: "https://",
  domain: "",
  noWebsite: false,
  contactName: "",
  position: "",
  email: "",
  phone: "",
  isNonResident: false,
  consent: false,
};

const STEP_LABELS: Record<Step, string> = {
  1: "Компанія",
  2: "Контактна інформація",
};

const DOMAIN_PATTERN = /^[a-z0-9а-яіїєґ-]+(\.[a-z0-9а-яіїєґ-]+)+(\/\S*)?$/i;

// Телефон -> +380XXXXXXXXX (резидент) или +цифры (нерезидент); null — формат не подходит
function normalizePhone(raw: string, isNonResident: boolean): string | null {
  const digits = raw.replace(/\D/g, "");

  if (isNonResident) {
    return digits.length >= 7 && digits.length <= 15 ? `+${digits}` : null;
  }

  if (digits.length === 12 && digits.startsWith("380")) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith("0")) return `+38${digits}`;
  return null;
}

function validateStep1(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (values.companyName.trim().length < 2) {
    errors.companyName = "Вкажіть назву компанії";
  }
  if (values.storeName.trim().length < 2) errors.storeName = "Вкажіть назву магазину";
  if (values.taxNumber.trim().length < 2) errors.taxNumber = "Вкажіть податковий номер або код компанії";

  if (!values.noWebsite && !DOMAIN_PATTERN.test(values.domain.trim())) {
    errors.domain = "Вкажіть адресу сайту, наприклад shop.com.ua, або позначте «У мене немає сайту»";
  }

  return errors;
}

function validateStep2(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (values.contactName.trim().split(/\s+/).filter(Boolean).length < 2) {
    errors.contactName = "Вкажіть прізвище та ім'я";
  }

  if (values.position.trim().length < 2) {
    errors.position = "Вкажіть вашу посаду";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Вкажіть коректний email";
  }

  if (!normalizePhone(values.phone, values.isNonResident)) {
    errors.phone = values.isNonResident
      ? "Вкажіть номер телефону з кодом країни"
      : "Вкажіть номер у форматі +380XXXXXXXXX або позначте «Нерезидент»";
  }

  if (!values.consent) {
    errors.consent = "Поле обов'язкове для заповнення";
  }

  return errors;
}

function hasErrors(errors: FormErrors): boolean {
  return Object.values(errors).some(Boolean);
}

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
};

// Подпись + поле + ошибка
function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label} <span className={styles.required}>*</span>
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

type SellApplicationFormProps = {
  onSubmitted: (application: SellerApplication) => void;
};

// Заявка в 2 шага, как у Rozetka: компания → контакты
export default function SellApplicationForm({ onSubmitted }: SellApplicationFormProps) {
  const { user } = useAuth();
  const baseId = useId();
  const id = (name: string) => `${baseId}-${name}`;

  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [values, setValues] = useState<FormValues>(() => ({ ...INITIAL_VALUES, email: user?.email ?? "", contactName: user?.name ?? "", phone: user?.phone ?? "" }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const companyRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const hasNavigated = useRef(false);

  // После перехода между шагами — фокус в первое поле (но не при первой загрузке)
  useEffect(() => {
    if (!hasNavigated.current) return;
    const target = step === 1 ? companyRef.current : contactRef.current;
    target?.focus({ preventScroll: true });
  }, [step]);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Ошибку поля убираем, как только его начали исправлять
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  // Если вставили адрес с протоколом — переключаем селект и оставляем только домен
  function handleDomainChange(raw: string) {
    const match = raw.trim().match(/^(https?):\/\//i);
    if (match) {
      const protocol: WebsiteProtocol =
        match[1]?.toLowerCase() === "http" ? "http://" : "https://";
      update("protocol", protocol);
      update("domain", raw.trim().slice(match[0].length));
      return;
    }
    update("domain", raw);
  }

  function a11y(key: keyof FormValues) {
    return {
      "aria-invalid": Boolean(errors[key]),
      "aria-describedby": errors[key] ? `${id(key)}-error` : undefined,
    };
  }

  function goToStep(next: Step) {
    hasNavigated.current = true;
    setDirection(next > step ? "forward" : "back");
    setSubmitError("");
    setStep(next);
  }

  function handleContinue() {
    const nextErrors = validateStep1(values);
    setErrors(nextErrors);
    if (!hasErrors(nextErrors)) goToStep(2);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Enter на первом шаге = «Продовжити»
    if (step === 1) {
      handleContinue();
      return;
    }

    setSubmitError("");
    const nextErrors = validateStep2(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setIsSubmitting(true);
    try {
      const application = await submitSellerApplication({
        companyName: values.companyName.trim(),
        storeName: values.storeName.trim(),
        taxNumber: values.taxNumber.trim(),
        website: values.noWebsite ? null : `${values.protocol}${values.domain.trim()}`,
        contactName: values.contactName.trim().replace(/\s+/g, " "),
        position: values.position.trim(),
        email: values.email.trim(),
        phone: normalizePhone(values.phone, values.isNonResident) ?? values.phone,
        isNonResident: values.isNonResident,
      });
      onSubmitted(application);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Не вдалося надіслати заявку. Спробуйте ще раз."
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {/* Индикатор шагов */}
      <ol className={styles.stepper} aria-label="Кроки заявки">
        {([1, 2] as Step[]).map((item) => {
          const isActive = item === step;
          const isDone = item < step;
          return (
            <li
              key={item}
              className={`${styles.stepItem} ${isActive ? styles.stepItemActive : ""} ${isDone ? styles.stepItemDone : ""}`}
              aria-current={isActive ? "step" : undefined}
            >
              <span className={styles.stepDot}>{isDone ? <IconCheck size={16} /> : item}</span>
              <span className={styles.stepLabel}>{STEP_LABELS[item]}</span>
            </li>
          );
        })}
        <li className={styles.stepBar} aria-hidden="true">
          <span className={styles.stepBarFill} style={{ width: step === 1 ? "50%" : "100%" }} />
        </li>
      </ol>

      {/* key перезапускает анимацию въезда шага */}
      <div
        key={step}
        className={`${styles.stepBody} ${direction === "forward" ? styles.slideForward : styles.slideBack}`}
      >
        {step === 1 ? (
          <>
            <h3 className={styles.stepTitle}>Розкажіть про компанію</h3>
            <p className={styles.stepText}>Крок 1 з 2 — це займе хвилину.</p>

            <div className={styles.fields}>
              <Field id={id("companyName")} label="Назва компанії" error={errors.companyName}>
                <input
                  ref={companyRef}
                  id={id("companyName")}
                  type="text"
                  className={`${styles.input} ${errors.companyName ? styles.inputError : ""}`}
                  value={values.companyName}
                  onChange={(e) => update("companyName", e.target.value)}
                  placeholder="Наприклад, «Затишний дім»"
                  autoComplete="organization"
                  {...a11y("companyName")}
                />
              </Field>

              <Field id={id("storeName")} label="Назва магазину" error={errors.storeName}>
                <input id={id("storeName")} className={styles.input} value={values.storeName} maxLength={200} onChange={e => update("storeName", e.target.value)} {...a11y("storeName")} />
              </Field>
              <Field id={id("taxNumber")} label="Податковий номер / код компанії" error={errors.taxNumber}>
                <input id={id("taxNumber")} className={styles.input} value={values.taxNumber} maxLength={100} onChange={e => update("taxNumber", e.target.value)} {...a11y("taxNumber")} />
              </Field>

              <div className={styles.field}>
                <label htmlFor={id("domain")} className={styles.label}>
                  Сайт компанії {!values.noWebsite && <span className={styles.required}>*</span>}
                </label>

                <div
                  className={`${styles.siteGroup} ${errors.domain ? styles.siteGroupError : ""} ${values.noWebsite ? styles.siteGroupDisabled : ""}`}
                >
                  <select
                    className={styles.protocol}
                    value={values.protocol}
                    onChange={(e) => update("protocol", e.target.value as WebsiteProtocol)}
                    disabled={values.noWebsite}
                    aria-label="Протокол сайту"
                  >
                    <option value="https://">https://</option>
                    <option value="http://">http://</option>
                  </select>
                  <input
                    id={id("domain")}
                    type="text"
                    inputMode="url"
                    className={styles.domain}
                    value={values.domain}
                    onChange={(e) => handleDomainChange(e.target.value)}
                    placeholder="shop.com.ua"
                    autoComplete="url"
                    disabled={values.noWebsite}
                    {...a11y("domain")}
                  />
                </div>
                {errors.domain && (
                  <p id={`${id("domain")}-error`} className={styles.error}>
                    {errors.domain}
                  </p>
                )}
              </div>

              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={values.noWebsite}
                  onChange={(e) => {
                    update("noWebsite", e.target.checked);
                    setErrors((prev) => ({ ...prev, domain: undefined }));
                  }}
                />
                У мене немає сайту
              </label>
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.submit} onClick={handleContinue}>
                Продовжити
                <IconArrowRight size={18} />
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className={styles.stepTitle}>Контактна інформація</h3>
            <p className={styles.stepText}>Крок 2 з 2 — куди менеджеру з вами зв&apos;язатися.</p>

            <div className={styles.fields}>
              <Field id={id("contactName")} label="Ваше ПІБ" error={errors.contactName}>
                <input
                  ref={contactRef}
                  id={id("contactName")}
                  type="text"
                  className={`${styles.input} ${errors.contactName ? styles.inputError : ""}`}
                  value={values.contactName}
                  onChange={(e) => update("contactName", e.target.value)}
                  placeholder="Петренко Іван Іванович"
                  autoComplete="name"
                  {...a11y("contactName")}
                />
              </Field>

              <Field id={id("position")} label="Посада" error={errors.position}>
                <input
                  id={id("position")}
                  type="text"
                  className={`${styles.input} ${errors.position ? styles.inputError : ""}`}
                  value={values.position}
                  onChange={(e) => update("position", e.target.value)}
                  placeholder="Директор, менеджер з продажу…"
                  autoComplete="organization-title"
                  {...a11y("position")}
                />
              </Field>

              <div className={styles.row}>
                <Field id={id("email")} label="Email" error={errors.email}>
                  <input
                    id={id("email")}
                    type="email"
                    className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                    value={values.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="name@company.ua"
                    autoComplete="email"
                    {...a11y("email")}
                  />
                </Field>

                <Field id={id("phone")} label="Номер телефону" error={errors.phone}>
                  <input
                    id={id("phone")}
                    type="tel"
                    className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                    value={values.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder={values.isNonResident ? "+48 …" : "+380 XX XXX XX XX"}
                    autoComplete="tel"
                    {...a11y("phone")}
                  />
                </Field>
              </div>

              <div className={styles.checkRow}>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={values.isNonResident}
                    onChange={(e) => {
                      update("isNonResident", e.target.checked);
                      setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                  />
                  Нерезидент
                </label>

                {/* Подсказка по наведению и по фокусу с клавиатуры */}
                <span className={styles.infoWrap}>
                  <button
                    type="button"
                    className={styles.infoButton}
                    aria-label="Що означає «Нерезидент»"
                    aria-describedby={id("nonresident-tip")}
                  >
                    i
                  </button>
                  <span id={id("nonresident-tip")} role="tooltip" className={styles.tooltip}>
                    Якщо ви вказуєте номер телефону не в українському форматі +380, позначте
                    «Нерезидент».
                  </span>
                </span>
              </div>

              <div>
                <label className={`${styles.checkRow} ${styles.consent}`}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={values.consent}
                    onChange={(e) => update("consent", e.target.checked)}
                    aria-invalid={Boolean(errors.consent)}
                  />
                  <span>
                    Заповнюючи анкету, я надаю згоду на обробку персональних даних відповідно до
                    Положення про обробку і захист персональних даних ТОВ «TREBA».{" "}
                    <span className={styles.required}>*</span>
                  </span>
                </label>
                {errors.consent && <p className={styles.error}>{errors.consent}</p>}
              </div>
            </div>

            {submitError && (
              <p className={styles.submitError} role="alert">
                {submitError}
              </p>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.back}
                onClick={() => goToStep(1)}
                disabled={isSubmitting}
              >
                <IconArrowRight size={18} className={styles.backArrow} />
                Назад
              </button>
              <button type="submit" className={styles.submit} disabled={isSubmitting}>
                {isSubmitting && <span className={styles.spinner} aria-hidden="true" />}
                {isSubmitting ? "Надсилаємо…" : "Зареєструватися"}
              </button>
            </div>
          </>
        )}
      </div>
    </form>
  );
}
