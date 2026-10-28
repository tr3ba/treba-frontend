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

// ---------- Оформление заказа ----------

/** Данные формы оформления (всё — строки из полей ввода). */
export type CheckoutForm = {
  deliveryMethod?: "NovaPoshta" | "TrebaCourier";
  deliveryQuoteId?: string;
  /** Применённый промокод (нормализованный) */
  couponCode?: string;
  firstName: string;
  lastName: string;
  /** +380XXXXXXXXX */
  phone: string;
  email: string;
  city: string;
  street: string;
  building: string;
  apartment: string;
  comment: string;
};

/** Позиция заказа: вариант и количество (цену бэк считает сам). */
export type CheckoutItem = {
  variantId: string;
  quantity: number;
  /** Название — бэк требует его в запросе, хотя берёт данные из базы */
  title: string;
};

/** Созданный заказ — для экрана «Замовлення оформлено». */
export type CreatedOrder = {
  id: string;
  number: string;
  status: string;
  subtotal: number;
  deliveryPrice: number;
  discount: number;
  total: number;
};

// ---------- DTO бэка: Contracts/Orders ----------

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

/** Позиция в POST /api/v1/orders (CreateOrderItemDto). */
export type ApiCreateOrderItem = {
  productId: string;
  variantId: string;
  sellerId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  productSnapshot: string | null;
};

/**
 * POST /api/v1/orders.
 * Бэк использует из позиций только variantId и quantity (цены, продавца, названия берёт из базы),
 * но строковые поля без `?` в C# проходят проверку как обязательные — поэтому заполняем их.
 */
export type ApiCreateOrderRequest = {
  deliveryMethod?: "NovaPoshta" | "TrebaCourier";
  deliveryQuoteId?: string;
  /** Пустой Guid — бэк подставит текущего пользователя */
  customerId: string;
  customerComment: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  address: {
    country: string;
    region: string | null;
    city: string;
    street: string;
    building: string;
    apartment: string | null;
    postalCode: string | null;
    recipientName: string;
    recipientPhone: string;
  };
  items: ApiCreateOrderItem[];
  couponCode: string | null;
};