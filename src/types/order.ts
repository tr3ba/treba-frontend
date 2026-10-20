// Статусы заказа — как в Domain/Enums/OrderStatus.cs на бэке
export type OrderStatus =
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY_FOR_SHIPMENT"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED";

/** Заказ в списке кабинета. */
export type OrderSummary = {
  id: string;
  /** Номер для покупателя */
  number: string;
  /** ISO-дата */
  createdAt: string;
  /** Статус с бэка; неизвестные показываем как есть */
  status: string;
  total: number;
  /** Фото первого товара; нет — иконка коробки */
  thumbnail?: string;
};

// ---------- DTO бэка: Contracts/Orders/OrderDto.cs ----------

export type ApiOrder = {
  id: string;
  orderNumber: string;
  customerId: string;
  status: string;
  currency: string;
  subtotal: number;
  discountAmount: number;
  deliveryPrice: number;
  totalAmount: number;
  recipientName: string;
  recipientPhone: string;
  createdAt: string;
};