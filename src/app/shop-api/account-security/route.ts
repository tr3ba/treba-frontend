import { NextRequest } from "next/server";
import { backend, clearSession, json, sameOrigin } from "../../../lib/server/session";
import { clearStaffSession } from "../../../lib/server/staff-session";
import { accountErrorResponse, currentAccount, saveAccountRenewal, smallJson, validScope } from "../../../lib/server/account-security";
import { decode, resultCookie, transientOptions } from "../../../lib/server/external-auth";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope");
  if (!validScope(scope)) return json({}, 400);
  let account: Awaited<ReturnType<typeof currentAccount>> = null;
  try {
    account = await currentAccount(request, scope);
    if (!account) return json({ message: "Потрібно увійти в акаунт знову." }, 401);
    const [settings, providers] = await Promise.all([
      backend("/api/security", { headers: { Authorization: `Bearer ${account.token}` } }),
      backend("/api/auth/external/providers"),
    ]);
    if (!settings.ok) return accountErrorResponse(json({ message: "Не вдалося завантажити налаштування захисту." }, settings.status), null, account);
    const stored = decode(request.cookies.get(resultCookie)?.value) as { expires?: number; actorId?: string; security?: unknown } | null;
    const pending = stored && stored.actorId === account.user.id && typeof stored.expires === "number" && stored.expires > Date.now() ? stored.security : undefined;
    const response = json({ settings: await settings.json(), providers: providers.ok ? await providers.json() : [], email: account.user.email, pending });
    if (pending) response.cookies.set(resultCookie, "", { ...transientOptions, maxAge: 0 });
    saveAccountRenewal(response, account);
    return response;
  } catch (error) { return accountErrorResponse(json({ message: "Сервіс тимчасово недоступний." }, 503), error, account); }
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({}, 403);
  let input;
  try { input = await smallJson(request); } catch { return json({}, 400); }
  if (!validScope(input.scope)) return json({}, 400);
  const routes: Record<string, string> = {
    reauthenticate: "/api/auth/reauthenticate", "send-mfa": "/api/auth/2fa/email/send",
    "begin-email": "/api/users/me/email-change", "confirm-email": "/api/users/me/email-change/confirm",
    "begin-link": "/api/users/me/external-link-confirmation", "email-setup": "/api/security/email/setup", "email-confirm": "/api/security/email/confirm",
  };
  const action = typeof input.action === "string" ? input.action : "";
  if (!routes[action]) return json({}, 404);
  const body = action === "reauthenticate" ? { password: input.password }
    : action.startsWith("begin-") ? { target: input.target, secondFactor: input.secondFactor }
    : action === "confirm-email" ? { challengeId: input.challengeId, currentEmailCode: input.currentEmailCode, newEmailCode: input.newEmailCode }
    : action === "email-confirm" ? { challengeId: input.challengeId, code: input.code }
    : action === "send-mfa" ? { challengeId: input.challengeId } : {};
  let account: Awaited<ReturnType<typeof currentAccount>> = null;
  try {
    account = await currentAccount(request, input.scope);
    if (!account) return json({ message: "Потрібно увійти в акаунт знову." }, 401);
    const result = await backend(routes[action], { method: "POST", headers: { Authorization: `Bearer ${account.token}` }, body: JSON.stringify(body) });
    const data = result.status === 204 ? { ok: true } : await result.json().catch(() => ({}));
    const response = result.ok ? json(data) : json({ message: result.status === 429
      ? "Забагато спроб. Спробуйте пізніше." : result.status === 401
        ? "Підтвердження недійсне. Повторіть вхід або перевірте код." : "Не вдалося виконати дію. Перевірте дані та почніть підтвердження ще раз." }, result.status);
    if (result.ok && (action === "confirm-email" || action === "email-confirm")) {
      (input.scope === "staff" ? clearStaffSession : clearSession)(response);
      response.cookies.set(resultCookie, "", { ...transientOptions, maxAge: 0 });
    } else saveAccountRenewal(response, account);
    return response;
  } catch (error) { return accountErrorResponse(json({ message: "Сервіс тимчасово недоступний." }, 503), error, account); }
}
