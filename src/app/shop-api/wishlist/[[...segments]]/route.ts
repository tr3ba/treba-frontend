import { NextRequest, NextResponse } from "next/server";
import { authenticated, backend, clearSession, json, sameOrigin, saveSession } from "../../../../lib/server/session";

export const runtime = "nodejs";

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ segments?: string[] }> };

// Прокси к /api/v1/wishlist: токен берём из HttpOnly-куки, браузер его не видит.
// Разрешено только: GET /shop-api/wishlist и POST|DELETE /shop-api/wishlist/products/{guid}.
async function proxy(request: NextRequest, context: RouteContext) {
  if (request.method !== "GET" && !sameOrigin(request)) return json({}, 403);

  const { segments = [] } = await context.params;
  const isList = segments.length === 0;
  const isProduct = segments.length === 2 && segments[0] === "products" && GUID.test(segments[1]);
  if ((request.method === "GET" && !isList) || (request.method !== "GET" && !isProduct)) {
    return json({}, 404);
  }

  try {
    const session = await authenticated(request);
    if (!session) {
      const response = json({ message: "Потрібно увійти в акаунт." }, 401);
      clearSession(response);
      return response;
    }

    const path = isList ? "/api/v1/wishlist" : `/api/v1/wishlist/products/${segments[1]}`;
    const result = await backend(path, {
      method: request.method,
      headers: { Authorization: `Bearer ${session.token}` },
    });

    const response = new NextResponse(result.status === 204 ? null : await result.text(), {
      status: result.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store, private" },
    });
    if (session.renewed) saveSession(response, session.renewed, session.remember);
    if (result.status === 401) clearSession(response);
    return response;
  } catch {
    return json({ message: "Не вдалося оновити список бажань. Спробуйте ще раз." }, 503);
  }
}

export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;