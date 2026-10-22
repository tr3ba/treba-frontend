export type Page<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number };
export type Preferences = { values: Record<string, string>; version: string };
export type CustomerOrder = {
  id: string; orderNumber: string; status: string; paymentStatus: string; currency: string;
  subtotal: number; discountAmount: number; deliveryPrice: number; totalAmount: number; createdAt: string;
  recipientName: string; recipientPhone: string; recipientEmail: string; deliveryAddress?: string;
  items: { id: string; productId: string; productSlug?: string; name: string; quantity: number; unitPrice: number; totalPrice: number; imageUrl?: string }[];
  history: { status: string; createdAt: string }[];
};
export type Notification = { key: string; kind: string; title: string; text: string; scope: "shop" | "admin"; path: string; createdAt: string; read: boolean };
export type NotificationFeed = { items: Notification[]; unreadCount: number };

export async function accountRequest<T>(path: string, options: { method?: "GET" | "POST" | "PATCH"; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const response = await fetch("/shop-api/account/" + path, {
    method: options.method ?? "GET", cache: "no-store", signal: options.signal,
    ...(options.body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(options.body) }),
  });
  if (response.status === 204) return undefined as T;
  const result = await response.json();
  if (!response.ok) throw new Error(response.status === 401 ? "Потрібно увійти в акаунт знову." : result.message ?? result.title ?? "Не вдалося завантажити дані. Спробуйте ще раз.");
  return result as T;
}

export function getCustomerOrders(page = 1, search = "", from?: string) {
  const query = new URLSearchParams({ page: String(page) });
  if (search) query.set("search", search); if (from) query.set("from", from);
  return accountRequest<Page<CustomerOrder>>("orders?" + query);
}
