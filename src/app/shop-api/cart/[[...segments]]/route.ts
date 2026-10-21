import { NextRequest, NextResponse } from "next/server";
import { authenticated, backend, clearSession, json, sameOrigin, saveSession } from "../../../../lib/server/session";

export const runtime = "nodejs";

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY_LENGTH = 2048;

type RouteContext = { params: Promise<{ segments?: string[] }> };

// Прокси к /api/v1/cart: токен берём из HttpOnly-куки, браузер его не видит.
// Разрешено только:
//   GET    /shop-api/cart                 — корзина
//   DELETE /shop-api/cart                 — очистить
//   POST   /shop-api/cart/items           — добавить
//   PATCH  /shop-api/cart/items/{guid}    — изменить количество
//   DELETE /shop-api/cart/items/{guid}    — удалить позицию
function resolvePath(method: string, segments: string[]): string | null {
  if (segments.length === 0) {
    return method === "GET" || method === "DELETE" ? "/api/v1/cart" : null;
  }
  if (segments[0] !== "items") return null;
  if (segments.length === 1) return method === "POST" ? "/api/v1/cart/items" : null;
  if (segments.length === 2 && GUID.test(segments[1]) && (method === "PATCH" || method === "DELETE")) {
    return `/api/v1/cart/items/${segments[1]}`;
  }
  return null;
}

async function proxy(request: NextRequest, context: RouteContext) {
  if (request.method !== "GET" && !sameOrigin(request)) return json({}, 403);

  const { segments = [] } = await context.params;
  const path = resolvePath(request.method, segments);
  if (!path) return json({}, 404);

  // Тело — только у POST/PATCH, небольшой JSON
  let body: string | undefined;
  if (request.method === "POST" || request.method === "PATCH") {
    body = await request.text();
    if (body.length === 0 || body.length > MAX_BODY_LENGTH) return json({}, 400);
  }

  try {
    const session = await authenticated(request);
    if (!session) {
      const response = json({ message: "Потрібно увійти в акаунт." }, 401);
      clearSession(response);
      return response;
    }

    const result = await backend(path, {
      method: request.method,
      headers: { Authorization: `Bearer ${session.token}` },
      body,
    });

    const response = new NextResponse(result.status === 204 ? null : await result.text(), {
      status: result.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store, private" },
    });
    if (session.renewed) saveSession(response, session.renewed, session.remember);
    if (result.status === 401) clearSession(response);
    return response;
  } catch {
    return json({ message: "Не вдалося оновити кошик. Спробуйте ще раз." }, 503);
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;