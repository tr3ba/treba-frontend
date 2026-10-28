import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { encode, isProvider, loginResult, newTransaction, providerInfo, redirect, resultCookie, siteOrigin, stateCookie, transientOptions } from "../../../../../lib/server/external-auth";
import { json } from "../../../../../lib/server/session";

export const runtime = "nodejs";
export async function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  if (!isProvider(provider)) return json({ message: "Невідомий спосіб входу." }, 404);
  const next = request.nextUrl.searchParams.get("next");
  try {
    const info = await providerInfo(provider);
    if (info.redirectUri !== `${siteOrigin(request)}/api/auth/external/${provider}/callback`) throw new Error("Не вдалося почати вхід. Спробуйте пізніше.");
    const transaction = newTransaction(info, next, request.nextUrl.searchParams.get("remember") !== "0");
    const target = new URL(info.authorizationUrl);
    target.search = new URLSearchParams({ client_id: info.clientId, redirect_uri: info.redirectUri, response_type: "code", state: transaction.state,
      scope: info.scopes.join(provider === "google" ? " " : ",") }).toString();
    if (provider === "google") {
      target.searchParams.set("code_challenge", createHash("sha256").update(transaction.verifier).digest("base64url"));
      target.searchParams.set("code_challenge_method", "S256");
      target.searchParams.set("prompt", "select_account");
    }
    const response = redirect(target);
    response.cookies.set(stateCookie(provider), encode(transaction), transientOptions);
    response.cookies.set(resultCookie, "", { ...transientOptions, maxAge: 0 });
    return response;
  } catch (error) {
    return loginResult(request, next ?? undefined, { message: error instanceof Error ? error.message : "Не вдалося почати вхід." });
  }
}
