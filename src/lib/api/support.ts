export type Conversation = {
  id: string; customerName: string; kind: "CHAT" | "QUESTION" | "RETURN"; subject: string; status: string;
  orderId?: string; orderNumber?: string; productId?: string; productName?: string; productSlug?: string; updatedAt: string;
  lastMessage?: string; unreadCount: number;
};
export type Message = { id: string; authorName: string; authorRole: string; message: string; internal: boolean; createdAt: string };
export type ConversationDetails = { summary: Conversation; messages: Message[]; hasEarlierMessages: boolean };
export type ConversationPage = { content: Conversation[]; page: number; totalPages: number };
export async function support<T>(path = "", body?: unknown): Promise<T> {
  const response = await fetch("/shop-api/support" + path, { method: body ? "POST" : "GET", cache: "no-store", headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
  if (!response.ok) throw new Error(response.status === 401 ? "Сесія завершилася. Увійдіть в акаунт ще раз." : response.status === 409 ? "Переписка змінилася. Оновіть її та спробуйте ще раз." : "Не вдалося завантажити або надіслати повідомлення. Спробуйте ще раз.");
  return response.status === 204 ? undefined as T : response.json();
}
