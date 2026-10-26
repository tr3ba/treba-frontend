"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import type { CartItem } from "../../types/cart";
import type { CheckoutForm as CheckoutFormValues, CreatedOrder } from "../../types/order";
import { createOrder, OrderError } from "../../lib/api/orders";
import { formatPrice, pluralize } from "../../lib/format";
import { DELIVERY_PRICE } from "../../lib/delivery";
import NovaPoshtaDelivery from "./NovaPoshtaDelivery";
import { deliveryRequest, type DeliveryQuote } from "../../lib/api/delivery";
import Icon from "../common/Icon";
import styles from "./CheckoutForm.module.css";

type CheckoutFormProps = {
  items: CartItem[];
  totalPrice: number;
  totalOldPrice: number;
  /** Начальные значения (из профиля) */
  initial: CheckoutFormValues;
  onSuccess: (order: CreatedOrder) => void | Promise<void>;
};

type FieldName = keyof CheckoutFormValues;
type FieldErrors = Partial<Record<FieldName, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Телефон в любом виде -> +380XXXXXXXXX; не похоже на украинский номер — null. */
function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (/^380\d{9}$/.test(digits)) return `+${digits}`;
  if (/^0\d{9}$/.test(digits)) return `+38${digits}`;
  return null;
}

function validate(values: CheckoutFormValues): FieldErrors {
  const errors: FieldErrors = {};
  const required = (name: FieldName, label: string, max: number) => {
    const value = (values[name] ?? "").trim();
    if (!value) errors[name] = `Вкажіть ${label}`;
    else if (value.length > max) errors[name] = `Не більше ${max} символів`;
  };

  required("firstName", "ім’я", 70);
  required("lastName", "прізвище", 70);
  required("city", "місто", 100);
  required("street", "вулицю", 150);
  required("building", "номер будинку", 50);

  if (!normalizePhone(values.phone)) errors.phone = "Вкажіть номер у форматі +380XXXXXXXXX";
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = "Вкажіть коректний email";
  if (values.apartment.trim().length > 50) errors.apartment = "Не більше 50 символів";
  if (values.comment.trim().length > 1000) errors.comment = "Не більше 1000 символів";
  return errors;
}

// Форма оформлення: отримувач + адреса (ліворуч), підсумок і підтвердження (праворуч)
export default function CheckoutForm({
  items,
  totalPrice,
  totalOldPrice,
  initial,
  onSuccess,
}: CheckoutFormProps) {
  const [values, setValues] = useState<CheckoutFormValues>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mode, setMode] = useState("nova");
  const [available, setAvailable] = useState(false);
  const [checkingDelivery, setCheckingDelivery] = useState(true);
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    deliveryRequest<{ available: boolean }>("capabilities", undefined, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setAvailable(result.available);
      if (!result.available) setMode(current => current === "nova" ? "courier" : current);
    }).catch(() => { if (!controller.signal.aborted) setMode(current => current === "nova" ? "courier" : current); })
      .finally(() => { if (!controller.signal.aborted) setCheckingDelivery(false); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!quote) return;
    const timer = setTimeout(() => setQuote(null), Math.max(0, Date.parse(quote.expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [quote]);
  const nova = mode === "nova";
  const deliveryPrice = nova ? quote?.price ?? 0 : DELIVERY_PRICE;
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const discount = Math.max(0, totalOldPrice - totalPrice);
  const total = totalPrice + deliveryPrice;
  // Позиции, которые нельзя заказать: без варианта или снятые с продажи
  const blocked = items.filter((item) => !item.variantId || item.available === false);

  function update(name: FieldName, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    if (nova && (!quote || Date.parse(quote.expiresAt) <= Date.now())) {
      setSubmitError("Виберіть відділення та отримайте актуальний розрахунок доставки."); return;
    }
    const checkoutValues: CheckoutFormValues = nova && quote
      ? { ...values, deliveryMethod: "NovaPoshta", city: quote.city.slice(0, 100), street: quote.pickupPoint.slice(0, 150), building: "—", apartment: "", deliveryQuoteId: quote.id }
      : { ...values, deliveryMethod: "TrebaCourier", deliveryQuoteId: undefined };
    const found = validate(checkoutValues);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setSubmitError("Перевірте поля, позначені червоним.");
      return;
    }
    if (blocked.length > 0) {
      setSubmitError("Деякі товари зараз недоступні. Приберіть їх із кошика і спробуйте ще раз.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const order = await createOrder(
        { ...checkoutValues, phone: normalizePhone(values.phone) ?? values.phone },
        items.flatMap((item) =>
          item.variantId ? [{ variantId: item.variantId, quantity: item.quantity, title: item.title }] : []
        )
      );
      await onSuccess(order);
    } catch (error) {
      setSubmitError(
        error instanceof OrderError ? error.message : "Не вдалося оформити замовлення. Спробуйте ще раз."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function field(name: FieldName, label: string, options: { type?: string; autoComplete?: string; optional?: boolean; placeholder?: string } = {}) {
    const id = `checkout-${name}`;
    return (
      <div className={styles.field}>
        <label htmlFor={id} className={styles.label}>
          {label}
          {options.optional && <span className={styles.optional}> (необов’язково)</span>}
        </label>
        <input
          id={id}
          name={name}
          type={options.type ?? "text"}
          autoComplete={options.autoComplete}
          placeholder={options.placeholder}
          className={`${styles.input} ${errors[name] ? styles.inputError : ""}`}
          value={values[name]}
          onChange={(event) => update(name, event.target.value)}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `${id}-error` : undefined}
        />
        {errors[name] && (
          <p id={`${id}-error`} className={styles.error}>
            {errors[name]}
          </p>
        )}
      </div>
    );
  }

  return (
    <form className={styles.layout} onSubmit={handleSubmit} noValidate>
      <div className={styles.main}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <span className={styles.step}>1</span>
            Отримувач
          </h2>
          <div className={styles.grid}>
            {field("firstName", "Ім’я", { autoComplete: "given-name" })}
            {field("lastName", "Прізвище", { autoComplete: "family-name" })}
            {field("phone", "Телефон", { type: "tel", autoComplete: "tel", placeholder: "+380" })}
            {field("email", "Email", { type: "email", autoComplete: "email" })}
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <span className={styles.step}>2</span>
            Доставка
          </h2>
          <fieldset className={styles.deliveryOptions}>
            <legend className={styles.label}>Спосіб доставки</legend>
            <label className={`${styles.deliveryOption} ${nova ? styles.deliverySelected : ""}`}>
              <input type="radio" name="delivery-method" value="nova" checked={nova} disabled={!available || isSubmitting} onChange={() => { setMode("nova"); setQuote(null); }} />
              <span><strong>Нова пошта</strong><small>У відділення або поштомат</small></span>
            </label>
            <label className={`${styles.deliveryOption} ${!nova ? styles.deliverySelected : ""}`}>
              <input type="radio" name="delivery-method" value="courier" checked={!nova} disabled={isSubmitting} onChange={() => { setMode("courier"); setQuote(null); }} />
              <span><strong>Кур’єр TREBA</strong><small>До дверей · {formatPrice(DELIVERY_PRICE)} ₴</small></span>
            </label>
          </fieldset>
          {checkingDelivery ? <p role="status">Перевіряємо способи доставки…</p> : !available && <p className={styles.optional}>Нова пошта тимчасово недоступна. Ви можете оформити кур’єрську доставку.</p>}
          {nova ? <>{available && <NovaPoshtaDelivery items={items} onQuote={setQuote} />}{quote && <div className={styles.deliveryQuote} role="status"><span>Вартість доставки</span><strong>{formatPrice(quote.price)} ₴</strong></div>}</> : <div className={styles.grid}>
            {field("city", "Місто", { autoComplete: "address-level2" })}
            {field("street", "Вулиця", { autoComplete: "address-line1" })}
            {field("building", "Будинок")}
            {field("apartment", "Квартира", { optional: true })}
          </div>}

          <div className={styles.field}>
            <label htmlFor="checkout-comment" className={styles.label}>
              Коментар до замовлення<span className={styles.optional}> (необов’язково)</span>
            </label>
            <textarea
              id="checkout-comment"
              name="comment"
              rows={3}
              className={`${styles.input} ${styles.textarea} ${errors.comment ? styles.inputError : ""}`}
              value={values.comment}
              onChange={(event) => update("comment", event.target.value)}
            />
            {errors.comment && <p className={styles.error}>{errors.comment}</p>}
          </div>
        </section>
      </div>

      <aside className={styles.summary}>
        <h2 className={styles.summaryTitle}>Ваше замовлення</h2>

        <ul className={styles.items}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <div className={styles.itemImageWrap}>
                {item.image ? (
                  <Image src={item.image} alt="" width={52} height={52} className={styles.itemImage} />
                ) : (
                  <Icon src="/icons/catalog.svg" className={styles.itemPlaceholder} />
                )}
              </div>
              <div className={styles.itemInfo}>
                <p className={styles.itemTitle}>{item.title}</p>
                <p className={styles.itemMeta}>
                  {item.quantity} шт. × {formatPrice(item.price)} ₴
                </p>
                {(!item.variantId || item.available === false) && (
                  <p className={styles.itemBlocked}>Недоступний для замовлення</p>
                )}
              </div>
              <span className={styles.itemTotal}>{formatPrice(item.price * item.quantity)} ₴</span>
            </li>
          ))}
        </ul>

        <dl className={styles.rows}>
          <div className={styles.row}>
            <dt>
              {totalCount} {pluralize(totalCount, ["товар", "товари", "товарів"])} на суму
            </dt>
            <dd>{formatPrice(totalOldPrice)} ₴</dd>
          </div>
          {discount > 0 && (
            <div className={styles.row}>
              <dt>Знижка</dt>
              <dd className={styles.discount}>−{formatPrice(discount)} ₴</dd>
            </div>
          )}
          <div className={styles.row}>
            <dt>Доставка</dt>
            <dd>{nova && !quote ? "Потрібен розрахунок" : `${formatPrice(deliveryPrice)} ₴`}</dd>
          </div>
        </dl>

        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>До сплати</span>
          <span className={styles.totalValue}>
            {nova && !quote ? "—" : formatPrice(total)}
            <span className={styles.currency}>₴</span>
          </span>
        </div>

        {submitError && (
          <p className={styles.submitError} role="alert">
            {submitError}
          </p>
        )}

        <button type="submit" className={styles.submit} disabled={isSubmitting || nova && !quote}>
          {isSubmitting ? "Оформлюємо…" : "Підтвердити замовлення"}
        </button>

        <p className={styles.note}>
          Після оформлення менеджер зв’яжеться з вами для підтвердження та оплати. Натискаючи кнопку,
          ви погоджуєтеся з умовами використання TREBA.
        </p>
      </aside>
    </form>
  );
}
