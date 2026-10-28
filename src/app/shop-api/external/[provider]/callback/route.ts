import { NextRequest } from "next/server";
import { getLoginDestination } from "../../../../../lib/admin";
import { isProvider, loginResult, readTransaction, redirect, resultCookie, siteOrigin, stateCookie, transientOptions } from "../../../../../lib/server/external-auth";
import { backend, json, saveLoginSession } from "../../../../../lib/server/session";

export const runtime = "nodejs";
export async function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  if (!isProvider(provider)) return json({}, 404);
  let response;
  try {
    const transaction = readTransaction(request, provider);
    if (!transaction) response = loginResult(request, undefined, { message: "Час входу минув або запит недійсний. Почніть вхід ще раз." });
    else if (request.nextUrl.searchParams.has("error")) response = loginResult(request, transaction.next, { message: "Вхід скасовано. Можна спробувати ще раз." });
    else {
      const code = request.nextUrl.searchParams.get("code");
      if (!code || code.length > 8192) throw new Error("Недійсний код входу.");
      const result = await backend("/api/auth/external/code", { method: "POST", body: JSON.stringify({ provider, code, redirectUri: transaction.redirectUri, codeVerifier: transaction.verifier }) });
      const data = await result.json();
      if (!result.ok) response = loginResult(request, transaction.next, { message: typeof data.message === "string" ? data.message.slice(0, 300) : "Не вдалося підтвердити вхід. Спробуйте ще раз." });
      else if (data.challenge) response = loginResult(request, transaction.next, { challenge: data.challenge, remember: transaction.remember });
      else {
        const authentication = data.authentication;
        if (!authentication?.accessToken || !authentication.refreshToken || !authentication.expiresAt) throw new Error("Не вдалося підтвердити вхід.");
        const destination = getLoginDestination(authentication.role ?? authentication.roleName, transaction.next) ?? transaction.next;
        response = redirect(new URL(destination, siteOrigin(request)));
        saveLoginSession(response, authentication, transaction.remember);
        response.cookies.set(resultCookie, "", { ...transientOptions, maxAge: 0 });
      }
    }
  } catch {
    response = loginResult(request, undefined, { message: "Не вдалося завершити вхід. Спробуйте ще раз." });
  }
  response.cookies.set(stateCookie(provider), "", { ...transientOptions, maxAge: 0 });
  return response;
}
