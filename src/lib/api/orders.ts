// Заказы покупателя.
// - Оформление: POST /api/v1/orders через прокси /shop-api/orders (нужна авторизация).
// - Список «мои заказы»: на бэке пока нет (есть только GET /api/v1/orders/{id}).
//   Когда появится — запрос через прокси + mapOrder ниже; страница кабинета не меняется.

import type {
  ApiCreateOrderRequest,
  ApiOrder,
  CheckoutForm,
  CheckoutItem,
  CreatedOrder,
  OrderStatus,
  OrderSummary,
} from "../../types/order";

const ORDERS_PROXY_URL = "/shop-api/orders";
const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";
const COUNTRY = "Україна";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: "Оформлено",
  AWAITING_PAYMENT: "Очікує оплати",
  PAID: "Оплачено",
  CONFIRMED: "Підтверджено",
  PROCESSING: "Комплектується",
  READY_FOR_SHIPMENT: "Готове до відправлення",
  SHIPPED: "Відправлено",
  DELIVERED: "Доставлено",
  COMPLETED: "Виконано",
  CANCELLED: "Скасовано",
  RETURN_REQUESTED: "Оформлено повернення",
  RETURNED: "Повернено",
};

function isKnownStatus(status: string): status is OrderStatus {
  return status in ORDER_STATUS_LABELS;
}

/** Текст статуса для UI. */
export function getOrderStatusLabel(status: string): string {
  return isKnownStatus(status) ? ORDER_STATUS_LABELS[status] : status;
}

/** Скасовані та повернені — показуємо сірим. */
export function isOrderInactive(status: string): boolean {
  return status === "CANCELLED" || status === "RETURNED";
}

export function mapOrder(dto: ApiOrder): OrderSummary {
  return {
    id: dto.id,
    number: dto.orderNumber,
    createdAt: dto.createdAt,
    status: dto.status,
    total: dto.totalAmount,
  };
}

/** Заказы текущего пользователя, новые сверху. Эндпоинта пока нет — пустой список. */
export async function getMyOrders(): Promise<OrderSummary[]> {
  return [];
}

// ---------- Оформление ----------

/** Ошибка оформления. message — готовый текст для UI (укр.). */
export class OrderError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "OrderError";
    this.status = status;
  }
}

// Ошибки бэка приходят на английском — переводим по смыслу
function messageForError(status: number, backendMessage: string): string {
  const text = backendMessage.toLowerCase();
  if (status === 0 || status === 503) return "Сервер недоступний. Спробуйте пізніше.";
  if (status === 401) return "Увійдіть в акаунт, щоб оформити замовлення.";
  if (text.includes("prices changed")) {
    return "Ціни на деякі товари змінилися. Перевірте кошик і підтвердьте замовлення ще раз.";
  }
  if (text.includes("unavailable")) {
    return "Деякі товари вже недоступні для покупки. Приберіть їх із кошика і спробуйте ще раз.";
  }
  if (text.includes("email")) return "Вкажіть коректний email.";
  if (text.includes("stock") || text.includes("insufficient")) {
    return "Недостатньо товару на складі. Зменшіть кількість і спробуйте ще раз.";
  }
  if (status === 400) return "Перевірте дані у формі замовлення.";
  return "Не вдалося оформити замовлення. Спробуйте ще раз.";
}

function toRequest(form: CheckoutForm, items: CheckoutItem[]): ApiCreateOrderRequest {
  const recipientName = `${form.firstName.trim()} ${form.lastName.trim()}`;
  const phone = form.phone.trim();
  return {
    customerId: EMPTY_GUID,
    customerComment: form.comment.trim(),
    recipientName,
    recipientPhone: phone,
    recipientEmail: form.email.trim(),
    address: {
      country: COUNTRY,
      region: null,
      city: form.city.trim(),
      street: form.street.trim(),
      building: form.building.trim(),
      apartment: form.apartment.trim() || null,
      postalCode: null,
      recipientName,
      recipientPhone: phone,
    },
    items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
    couponCode: null,
  };
}

async function readBackendMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null) {
      const record = body as Record<string, unknown>;
      const message = record.message ?? record.title ?? record.detail;
      if (typeof message === "string") return message;
    }
  } catch {
    // тело не JSON
  }
  return "";
}

/** Оформить заказ. Цены и доставку считает бэк. */
export async function createOrder(form: CheckoutForm, items: CheckoutItem[]): Promise<CreatedOrder> {
  let response: Response;
  try {
    response = await fetch(ORDERS_PROXY_URL, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toRequest(form, items)),
    });
  } catch {
    throw new OrderError(0, messageForError(0, ""));
  }

  if (!response.ok) {
    throw new OrderError(response.status, messageForError(response.status, await readBackendMessage(response)));
  }

  const dto = (await response.json()) as ApiOrder;
  return {
    id: dto.id,
    number: dto.orderNumber,
    status: dto.status,
    subtotal: dto.subtotal,
    deliveryPrice: dto.deliveryPrice,
    discount: dto.discountAmount,
    total: dto.totalAmount,
  };
}