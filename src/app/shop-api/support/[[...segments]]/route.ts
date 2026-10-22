import { NextRequest, NextResponse } from "next/server";
import { authenticated, backend, clearSession, json, sameOrigin, saveSession } from "../../../../lib/server/session";

export const runtime = "nodejs";
async function proxy(request: NextRequest, context: { params: Promise<{ segments?: string[] }> }) {
  if (request.method !== "GET" && !sameOrigin(request)) return json({}, 403);
  const { segments = [] } = await context.params;
  const path = segments.join("/");
  // Never proxy arbitrary URLs, staff status operations, or other API resources.
  if (!/^(?:[0-9a-f-]{36}(?:\/(?:messages|read))?)?$/.test(path)
    || request.method === "POST" && segments.length === 1
    || request.method === "GET" && segments[1] === "read") return json({}, 404);
  try {
    const session = await authenticated(request);
    if (!session) { const response = json({ message: "Потрібно увійти в акаунт." }, 401); clearSession(response); return response; }
    let body: string | undefined;
    if (request.method === "POST") {
      const text = await request.text(); if (text.length > 24000) return json({}, 413);
      let input;
      try { input = JSON.parse(text); } catch { return json({}, 400); }
      if (!input || typeof input !== "object" || Array.isArray(input)) return json({}, 400);
      if (input.internal === true) return json({}, 403);
      body = JSON.stringify(input);
    }
    const query = new URLSearchParams();
    for (const key of ["page", "status", "kind", "productId", "orderId", "before", "search", "view"]) {
      const value = request.nextUrl.searchParams.get(key); if (value) query.set(key, value);
    }
    const result = await backend(`/api/v1/support${path ? "/" + path : ""}?${query}`, { method: request.method, body, headers: { Authorization: `Bearer ${session.token}` } });
    const response = new NextResponse(result.status === 204 ? null : await result.text(), { status: result.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store, private" } });
    if (session.renewed) saveSession(response, session.renewed, session.remember);
    if (result.status === 401) clearSession(response);
    return response;
  } catch { return json({ message: "Не вдалося зв’язатися з підтримкою. Спробуйте ще раз." }, 503); }
}
export const GET = proxy;
export const POST = proxy;
