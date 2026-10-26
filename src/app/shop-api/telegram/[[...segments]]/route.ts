import { NextRequest, NextResponse } from "next/server";
import { authenticated, backend, clearSession, json, sameOrigin, saveSession } from "../../../../lib/server/session";
export const runtime = "nodejs";
type Context = { params: Promise<{ segments?: string[] }> };
async function proxy(request: NextRequest, context: Context) {
  const path = (await context.params).segments?.join("/") ?? "";
  const get = request.method === "GET";
  if (!(path === "link" && ["GET", "POST", "DELETE"].includes(request.method) || path === "link/confirm" && request.method === "POST")) return json({}, 404);
  if (!get && !sameOrigin(request)) return json({}, 403);
  try {
    const session = await authenticated(request);
    if (!session) { const response = json({}, 401); clearSession(response); return response; }
    const body = get || request.method === "DELETE" ? undefined : await request.text();
    if (body !== undefined && (body.length === 0 || body.length > 2048)) return json({}, 400);
    const result = await backend("/api/telegram/" + path, { method: request.method, headers: { Authorization: `Bearer ${session.token}` }, body });
    const response = new NextResponse(result.status === 204 ? null : await result.text(), { status: result.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store, private" } });
    if (session.renewed) saveSession(response, session.renewed, session.remember);
    if (result.status === 401) clearSession(response);
    return response;
  } catch { return json({ message: "Telegram тимчасово недоступний. Спробуйте пізніше." }, 503); }
}
export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
