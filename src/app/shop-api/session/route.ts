import { NextRequest } from "next/server";
import { authenticated, backend, clearSession, clearAdminHandoff, json, sameOrigin, saveSession, saveLoginSession } from "../../../lib/server/session";
import { canUseCustomerAccount } from "../../../lib/admin";
import { resultCookie, transientOptions } from "../../../lib/server/external-auth";
import { clearStaffSession } from "../../../lib/server/staff-session";

export const runtime = "nodejs";
function profile(data: Record<string, unknown>) {
  return { id: data.id ?? data.userId, email: data.email, firstName: data.firstName, lastName: data.lastName,
    name: `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim(), phone: data.phone, role: data.role ?? data.roleName };
}
export async function GET(request: NextRequest) {
  try {
    const session = await authenticated(request);
    if (!session) { const response = json({ user: null }, 401); clearSession(response); return response; }
    const result = await backend("/api/users/me", { headers: { Authorization: `Bearer ${session.token}` } });
    if (!result.ok) { const response = json({ user: null }, result.status); if (result.status === 401 || result.status === 404) clearSession(response); return response; }
    const user = profile(await result.json());
    if (!canUseCustomerAccount(user.role as string | undefined)) { const response = json({ user: null }, 403); clearSession(response); return response; }
    const response = json({ user });
    if (session.renewed) saveSession(response, session.renewed, session.remember);
    return response;
  } catch { return json({ message: "Не вдалося перевірити вхід. Спробуйте ще раз." }, 503); }
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ message: "Недозволений запит." }, 403);
  let input;
  try { const text = await request.text(); if (text.length > 12000) return json({}, 413); input = JSON.parse(text); } catch { return json({}, 400); }
  if (!input || typeof input !== "object" || Array.isArray(input)) return json({}, 400);
  const routes: Record<string, string> = { login: "/api/auth/login", register: "/api/auth/register", "registration-verify": "/api/auth/registration/verify", "registration-resend": "/api/auth/registration/resend", "password-reset-request": "/api/auth/password-reset/request", "password-reset-complete": "/api/auth/password-reset/complete", verify: "/api/auth/2fa/verify", email: "/api/auth/2fa/email/send", "guard-start": "/api/telegram/guard", "guard-status": "/api/telegram/guard/status", "guard-complete": "/api/telegram/guard/complete" };
  try {
    if (input.action === "logout") {
      const session = await authenticated(request);
      try { if (session) await backend("/api/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ refreshToken: session.renewed?.refreshToken ?? request.cookies.get("treba_refresh")?.value }) }); }
      finally { /* Local cookies are cleared even if the backend has already expired the session. */ }
      const response = json({ user: null }); clearSession(response); clearAdminHandoff(response); clearStaffSession(response); return response;
    }
    const path = routes[input.action];
    if (!path) return json({}, 400);
    const body = input.action === "register" ? { email: input.email, password: input.password, firstName: input.firstName, lastName: input.lastName, phoneNumber: input.phone, roleName: "Customer", verificationMethod: input.verificationMethod }
      : input.action === "password-reset-request" ? { email: input.email, verificationMethod: input.verificationMethod }
      : input.action === "password-reset-complete" ? { challengeId: input.challengeId, code: input.code, newPassword: input.newPassword }
      : input.action === "login" ? { email: input.email, password: input.password }
      : input.action === "email" || input.action === "registration-resend" ? { challengeId: input.challengeId }
      : input.action === "registration-verify" ? { challengeId: input.challengeId, code: input.code }
      : input.action === "guard-start" ? { deviceName: "Вхід із сайту TREBA", loginChallengeId: input.challengeId }
      : input.action === "guard-status" || input.action === "guard-complete" ? { id: input.id, browserSecret: input.browserSecret }
      : { challengeId: input.challengeId, method: input.method, code: input.code };
    if (input.action === "guard-start" && typeof input.challengeId !== "string") return json({}, 400);
    const result = await backend(path, { method: "POST", body: JSON.stringify(body) });
    if (!result.ok) {
      if (input.action === "register" || input.action === "registration-verify" || input.action === "registration-resend"
        || input.action === "password-reset-request" || input.action === "password-reset-complete") {
        const error = await result.json().catch(() => ({}));
        const message = result.status === 429 ? "Забагато запитів. Зачекайте хвилину та спробуйте ще раз."
          : result.status === 401 ? "Невірний або прострочений код. Спробуйте ще раз або надішліть новий код."
          : error.message ?? error.title;
        return json({ message: typeof message === "string" ? message.slice(0, 500) : "Не вдалося виконати підтвердження." }, result.status);
      }
      return json({ message: result.status === 401 ? "Невірні дані входу або код підтвердження." : "Не вдалося виконати запит. Перевірте дані та спробуйте ще раз." }, result.status);
    }
    if (input.action === "password-reset-complete") {
      const response = json({ ok: true }); clearSession(response); clearAdminHandoff(response); clearStaffSession(response); return response;
    }
    if (result.status === 204) return json({ ok: true });
    const data = await result.json();
    if (input.action === "register" || input.action === "registration-resend" || input.action === "password-reset-request") return json({ challenge: data });
    if (input.action === "guard-start" || input.action === "guard-status") return json(data);
    if (data.challenge) return json({ challenge: data.challenge });
    const authentication = data.authentication ?? data;
    if (!authentication.accessToken || !authentication.refreshToken) return json({}, 502);
    const response = json({ user: profile(authentication) }); saveLoginSession(response, authentication, input.remember !== false);
    if (request.cookies.has(resultCookie)) response.cookies.set(resultCookie, "", { ...transientOptions, maxAge: 0 });
    return response;
  } catch {
    const response = json({ message: "Сервер недоступний. Спробуйте ще раз." }, 503);
    if (input.action === "logout") clearSession(response);
    return response;
  }
}
