export type DeliveryCity = { ref: string; name: string; area: string };
export type DeliveryPoint = { ref: string; cityRef: string; name: string; number: string; postomat: boolean };
export type DeliveryQuote = { id: string; price: number; currency: string; city: string; pickupPoint: string; weightKg: number; estimatedWeight: boolean; expiresAt: string; shipmentMode: string };
export type OrderDelivery = { carrier: "NovaPoshta" | "TrebaCourier"; reference: string | null; city: string; pickupPoint: string; postomat: boolean; status: string };

export function deliveryCarrierLabel(carrier: string): string {
  return carrier === "NovaPoshta" ? "Нова пошта" : "Кур’єр TREBA";
}

export async function deliveryRequest<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch("/shop-api/delivery/" + path, { method: body === undefined ? "GET" : "POST", cache: "no-store", signal,
    ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.title ?? result.message ?? "Не вдалося завантажити доставку. Спробуйте пізніше.");
  return result as T;
}
