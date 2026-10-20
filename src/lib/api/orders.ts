// Заказы покупателя.
// На бэке есть только GET /api/v1/orders/{id}; списка «мои заказы» пока нет.
// Когда появится — запрос через прокси /shop-api (нужна авторизация) + mapOrder ниже.
// Страница кабинета при этом не меняется.

import type { ApiOrder, OrderStatus, OrderSummary } from "../../types/order";

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