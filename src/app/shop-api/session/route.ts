import { NextRequest } from "next/server";
import { authenticated, backend, clearSession, json, sameOrigin, saveSession } from "../../../lib/server/session";

export const runtime = "nodejs";
function profile(data: Record<string, unknown>) {
  return { id: data.id ?? data.userId, email: data.email, firstName: data.firstName, lastName: data.lastName,
    name: `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim(), phone: data.phone };
}
export async function GET(request: NextRequest) {
  try {
    const session = await authenticated(request);
    if (!session) { const response = json({ user: null }, 401); clearSession(response); return response; }
    const result = await backend("/api/users/me", { headers: { Authorization: `Bearer ${session.token}` } });
    if (!result.ok) { const response = json({ user: null }, result.status); if (result.status === 401 || result.status === 404) clearSession(response); return response; }
    const response = json({ user: profile(await result.json()) });
    if (session.renewed) saveSession(response, session.renewed, session.remember);
    return response;
  } catch { return json({ message: "Не вдалося перевірити вхід. Спробуйте ще раз." }, 503); }
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ message: "Недозволений запит." }, 403);
  let input;
  try { const text = await request.text(); if (text.length > 12000) return json({}, 413); input = JSON.parse(text); } catch { return json({}, 400); }
  if (!input || typeof input !== "object" || Array.isArray(input)) return json({}, 400);
  const routes: Record<string, string> = { login: "/api/auth/login", register: "/api/auth/register", verify: "/api/auth/2fa/verify", email: "/api/auth/2fa/email/send" };
  try {
    if (input.action === "logout") {
      const session = await authenticated(request);
      try { if (session) await backend("/api/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ refreshToken: session.renewed?.refreshToken ?? request.cookies.get("treba_refresh")?.value }) }); }
      finally { /* Local cookies are cleared even if the backend has already expired the session. */ }
      const response = json({ user: null }); clearSession(response); return response;
    }
    const path = routes[input.action];
    if (!path) return json({}, 400);
    const body = input.action === "register" ? { email: input.email, password: input.password, firstName: input.firstName, lastName: input.lastName, phoneNumber: input.phone, roleName: "Customer" }
      : input.action === "login" ? { email: input.email, password: input.password }
      : input.action === "email" ? { challengeId: input.challengeId }
      : { challengeId: input.challengeId, method: input.method, code: input.code };
    const result = await backend(path, { method: "POST", body: JSON.stringify(body) });
    if (!result.ok) return json({ message: result.status === 401 ? "Невірні дані входу або код підтвердження." : "Не вдалося виконати запит. Перевірте дані та спробуйте ще раз." }, result.status);
    if (result.status === 204) return json({ ok: true });
    const data = await result.json();
    if (data.challenge) return json({ challenge: data.challenge });
    const authentication = data.authentication ?? data;
    if (!authentication.accessToken || !authentication.refreshToken) return json({}, 502);
    const response = json({ user: profile(authentication) }); saveSession(response, authentication, input.remember !== false); return response;
  } catch {
    const response = json({ message: "Сервер недоступний. Спробуйте ще раз." }, 503);
    if (input.action === "logout") clearSession(response);
    return response;
  }
}
