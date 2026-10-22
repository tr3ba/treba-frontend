import { NextRequest, NextResponse } from "next/server";
import { authenticated, backend, clearSession, json, sameOrigin, saveSession } from "../../../../lib/server/session";

export const runtime = "nodejs";
type Context = { params: Promise<{ segments: string[] }> };
async function proxy(request: NextRequest, context: Context) {
  const { segments } = await context.params;
  const path = segments.join("/");
  const get = request.method === "GET";
  const allowed = get ? /^(preferences|orders|orders\/[0-9a-f-]{36}|seller-application|notifications)$/i.test(path)
    : request.method === "PATCH" ? path === "preferences" : ["seller-application", "notifications/read"].includes(path);
  if (!allowed) return json({}, 404);
  if (!get && !sameOrigin(request)) return json({}, 403);
  if (request.nextUrl.search.length > 2048) return json({}, 400);
  try {
    const session = await authenticated(request);
    if (!session) { const response = json({ message: "Потрібно увійти в акаунт." }, 401); clearSession(response); return response; }
    const body = get ? undefined : await request.text();
    if (body !== undefined && (body.length === 0 || body.length > 24000)) return json({}, 400);
    const result = await backend("/api/v1/account/" + path + request.nextUrl.search, {
      method: request.method, headers: { Authorization: `Bearer ${session.token}` }, body,
    });
    const response = new NextResponse(result.status === 204 ? null : await result.text(), {
      status: result.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store, private" },
    });
    if (session.renewed) saveSession(response, session.renewed, session.remember);
    if (result.status === 401) clearSession(response);
    return response;
  } catch { return json({ message: "Сервіс тимчасово недоступний. Спробуйте ще раз." }, 503); }
}
export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
