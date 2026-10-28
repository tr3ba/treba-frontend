// Промокоди на оформленні замовлення.
// DTO бэка: Application/Promotions (CouponValidationResult, DiscountResult).

/** Позиція для розрахунку знижки (PriceItem). */
export type CouponItem = {
  variantId: string;
  quantity: number;
};

/** Ответ POST /api/v1/promotions/validate-coupon. */
export type ApiCouponValidation = {
  isValid: boolean;
  /** COUPON_NOT_FOUND, COUPON_EXPIRED, ... */
  errorCode: string | null;
  errorMessage: string | null;
  couponId: string | null;
  promotionId: string | null;
};

/** Ответ POST /api/v1/promotions/calculate. */
export type ApiDiscountResult = {
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  freeDelivery: boolean;
  couponId: string | null;
  promotionId: string | null;
};

/** Применённый промокод в UI. */
export type AppliedCoupon = {
  /** Нормализованный код (trim + верхний регистр) — тот же уходит в доставку и заказ */
  code: string;
  /** Скидка в гривнах (0 — если промокод даёт только бесплатную доставку) */
  discount: number;
  freeDelivery: boolean;
};