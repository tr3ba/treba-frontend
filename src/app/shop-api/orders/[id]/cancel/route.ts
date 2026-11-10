import { NextRequest, NextResponse } from "next/server";
import { authenticated, backend, clearSession, json, sameOrigin, saveSession } from "../../../../../lib/server/session";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_REASON_LENGTH = 500;

// Прокси к POST /api/v1/orders/{id}/cancel (отмена заказа покупателем). Токен — из HttpOnly-куки.
// Тело — JSON-строка с причиной. Чужой заказ бэк не отменит: ищет только среди заказов текущего пользователя.
export async function POST(request: NextRequest, context: Context) {
  if (!sameOrigin(request)) return json({}, 403);

  const { id } = await context.params;
  if (!GUID.test(id)) return json({}, 404);

  // Пропускаем только непустую строку разумной длины
  const body = await request.text();
  let reason: unknown;
  try {
    reason = JSON.parse(body);
  } catch {
    return json({}, 400);
  }
  if (typeof reason !== "string" || reason.trim().length === 0 || reason.length > MAX_REASON_LENGTH) {
    return json({}, 400);
  }

  try {
    const session = await authenticated(request);
    if (!session) {
      const response = json({ message: "Потрібно увійти в акаунт." }, 401);
      clearSession(response);
      return response;
    }

    const result = await backend(`/api/v1/orders/${id}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.token}` },
      body: JSON.stringify(reason.trim()),
    });

    const response = new NextResponse(result.status === 204 ? null : await result.text(), {
      status: result.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store, private" },
    });
    if (session.renewed) saveSession(response, session.renewed, session.remember);
    if (result.status === 401) clearSession(response);
    return response;
  } catch {
    return json({ message: "Не вдалося скасувати замовлення. Спробуйте ще раз." }, 503);
  }
}