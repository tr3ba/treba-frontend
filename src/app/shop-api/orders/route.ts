import { NextRequest, NextResponse } from "next/server";
import { authenticated, backend, clearSession, json, sameOrigin, saveSession } from "../../../lib/server/session";

export const runtime = "nodejs";

const MAX_BODY_LENGTH = 16 * 1024;

// Прокси к POST /api/v1/orders (оформление заказа). Токен — из HttpOnly-куки.
// Ответ бэка (в т.ч. текст ошибки) передаём как есть — переводит его lib/api/orders.ts.
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({}, 403);

  const body = await request.text();
  if (body.length === 0 || body.length > MAX_BODY_LENGTH) return json({}, 400);

  try {
    const session = await authenticated(request);
    if (!session) {
      const response = json({ message: "Потрібно увійти в акаунт." }, 401);
      clearSession(response);
      return response;
    }

    const result = await backend("/api/v1/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.token}` },
      body,
    });

    const response = new NextResponse(await result.text(), {
      status: result.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store, private" },
    });
    if (session.renewed) saveSession(response, session.renewed, session.remember);
    if (result.status === 401) clearSession(response);
    return response;
  } catch {
    return json({ message: "Не вдалося оформити замовлення. Спробуйте ще раз." }, 503);
  }
}