import { NextRequest, NextResponse } from "next/server";
import { authenticated, backend, clearSession, json, sameOrigin, saveSession } from "../../../../lib/server/session";

export const runtime = "nodejs";

// Прокси к /api/v1/promotions/* (проверка промокода и расчёт скидки). Токен — из HttpOnly-куки.
const ACTIONS = ["validate-coupon", "calculate"];
const MAX_BODY_LENGTH = 16 * 1024;

type Context = { params: Promise<{ action: string }> };

export async function POST(request: NextRequest, context: Context) {
  const { action } = await context.params;
  if (!ACTIONS.includes(action)) return json({}, 404);
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

    const result = await backend(`/api/v1/promotions/${action}`, {
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
    return json({ message: "Не вдалося перевірити промокод. Спробуйте пізніше." }, 503);
  }
}