// Промокоды: проверка и расчёт скидки через прокси /shop-api/promotions (нужна авторизация).
// Скидку в заказе бэк всё равно считает сам — здесь только показываем её заранее.

import type { ApiCouponValidation, ApiDiscountResult, AppliedCoupon, CouponItem } from "../../types/promotion";

const PROXY_URL = "/shop-api/promotions/";
const MAX_CODE_LENGTH = 100;

/** Ошибка промокода. message — готовый текст для UI (укр.). */
export class CouponError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CouponError";
  }
}

// Коды ошибок бэка (DiscountService.ValidateCouponAsync) -> текст для покупателя
const ERROR_MESSAGES: Record<string, string> = {
  COUPON_CODE_REQUIRED: "Введіть промокод.",
  COUPON_NOT_FOUND: "Такого промокоду не існує. Перевірте, чи правильно його введено.",
  COUPON_INACTIVE: "Цей промокод більше не діє.",
  COUPON_NOT_STARTED: "Промокод ще не почав діяти.",
  COUPON_EXPIRED: "Термін дії промокоду закінчився.",
  COUPON_USAGE_LIMIT_REACHED: "Промокод уже використано максимальну кількість разів.",
  COUPON_USER_LIMIT_REACHED: "Ви вже використали цей промокод.",
  PROMOTION_NOT_FOUND: "Акція, до якої належить промокод, зараз не діє.",
  PROMOTION_INACTIVE: "Акція, до якої належить промокод, зараз не діє.",
  PROMOTION_OUTSIDE_ACTIVE_PERIOD: "Акція, до якої належить промокод, зараз не діє.",
};

const UNAVAILABLE = "Не вдалося перевірити промокод. Спробуйте пізніше.";

/** Код так, как его сравнивает бэк: без пробелов по краям, в верхнем регистре. */
export function normalizeCouponCode(value: string): string {
  return value.trim().toUpperCase();
}

async function post<T>(action: "validate-coupon" | "calculate", body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(PROXY_URL + action, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new CouponError(UNAVAILABLE);
  }
  if (response.status === 401) throw new CouponError("Увійдіть в акаунт, щоб застосувати промокод.");
  if (!response.ok) throw new CouponError(UNAVAILABLE);
  return (await response.json()) as T;
}

/**
 * Проверить промокод и узнать скидку для текущих товаров.
 * Код действует, но не подходит к товарам (категория, мин. сумма) — тоже ошибка.
 */
export async function applyCoupon(value: string, items: CouponItem[]): Promise<AppliedCoupon> {
  const code = normalizeCouponCode(value);
  if (!code) throw new CouponError(ERROR_MESSAGES.COUPON_CODE_REQUIRED);
  if (code.length > MAX_CODE_LENGTH) throw new CouponError(ERROR_MESSAGES.COUPON_NOT_FOUND);
  if (items.length === 0) throw new CouponError("Немає товарів, до яких можна застосувати промокод.");

  const check = await post<ApiCouponValidation>("validate-coupon", { couponCode: code });
  if (!check.isValid) {
    throw new CouponError(ERROR_MESSAGES[check.errorCode ?? ""] ?? "Промокод недійсний.");
  }

  const result = await post<ApiDiscountResult>("calculate", { items, couponCode: code });
  if (result.discountAmount <= 0 && !result.freeDelivery) {
    throw new CouponError("Промокод не діє для товарів у вашому замовленні.");
  }

  return { code, discount: result.discountAmount, freeDelivery: result.freeDelivery };
}