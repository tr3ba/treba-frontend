import { NextRequest, NextResponse } from "next/server";
import { authenticated, backend, json, saveSession } from "../../../lib/server/session";
import { adminOrigin } from "../../../lib/admin";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state");
  if (!state || !/^[A-F0-9]{64}$/.test(state)) return json({ message: "Почніть вхід з кнопки «Адмін-панель»." }, 400);
  try {
    const session = await authenticated(request);
    if (!session) {
      // Keep the public browser origin: behind Caddy, request.url can contain the container's localhost.
      const query = new URLSearchParams({ next: "/shop-api/admin-entry?state=" + state });
      return new NextResponse(null, { status: 307, headers: { Location: "/login?" + query, "Cache-Control": "no-store, private", "Referrer-Policy": "no-referrer" } });
    }
    const result = await backend("/api/auth/admin-entry", { method: "POST", headers: { Authorization: `Bearer ${session.token}` }, body: "{}" });
    if (!result.ok) return json({ message: result.status === 403 ? "Адмін-панель доступна лише співробітникам і продавцям." : "Не вдалося відкрити адмін-панель. Спробуйте ще раз." }, result.status);
    const data = await result.json();
    const target = new URL("/site-login/callback", process.env.TREBA_ADMIN_ORIGIN ?? adminOrigin);
    if (target.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(target.hostname))) throw new Error("Invalid admin origin");
    target.searchParams.set("state", state); target.searchParams.set("code", data.code);
    const response = NextResponse.redirect(target);
    response.headers.set("Cache-Control", "no-store, private"); response.headers.set("Referrer-Policy", "no-referrer");
    if (session.renewed) saveSession(response, session.renewed, session.remember);
    return response;
  } catch { return json({ message: "Сервіс входу тимчасово недоступний." }, 503); }
}
