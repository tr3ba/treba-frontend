import { NextRequest, NextResponse } from "next/server";
import { authenticated, backend, clearSession, json, sameOrigin, saveSession } from "../../../../lib/server/session";

export const runtime = "nodejs";
type Context = { params: Promise<{ segments: string[] }> };
async function proxy(request: NextRequest, context: Context) {
  const path = (await context.params).segments.join("/");
  const get = request.method === "GET";
  if (!(get ? ["capabilities", "cities", "pickup-points"].includes(path) : request.method === "POST" && path === "quotes")) return json({}, 404);
  if (!get && !sameOrigin(request)) return json({}, 403);
  if (request.nextUrl.search.length > 2048) return json({}, 400);
  try {
    const session = await authenticated(request);
    if (!session) { const response = json({ message: "Потрібно увійти в акаунт." }, 401); clearSession(response); return response; }
    const body = get ? undefined : await request.text();
    if (body !== undefined && (body.length === 0 || body.length > 24000)) return json({}, 400);
    const result = await backend("/api/v1/delivery/" + path + request.nextUrl.search, { method: request.method, headers: { Authorization: `Bearer ${session.token}` }, body });
    const response = new NextResponse(await result.text(), { status: result.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store, private" } });
    if (session.renewed) saveSession(response, session.renewed, session.remember);
    if (result.status === 401) clearSession(response);
    return response;
  } catch { return json({ message: "Доставка тимчасово недоступна. Спробуйте пізніше." }, 503); }
}
export const GET = proxy;
export const POST = proxy;
