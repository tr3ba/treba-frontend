import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { accountErrorResponse, accountPath, currentAccount, saveAccountRenewal, validScope, type AccountScope } from "./account-security";
import { encode, newTransaction, providerInfo, redirect, resultCookie, siteOrigin, transientOptions, type ExternalProvider, type ExternalTransaction } from "./external-auth";
import { backend, json } from "./session";

function result(request: NextRequest, scope: AccountScope, actorId: string, security: unknown) {
  const response = redirect(new URL(accountPath(scope) + "?security=1", siteOrigin(request)));
  response.cookies.set(resultCookie, encode({ actorId, security, expires: Date.now() + 600000 }), transientOptions);
  return response;
}
export async function startAccountOAuth(request: NextRequest, provider: ExternalProvider, input: Record<string, unknown>) {
  if (!validScope(input.scope) || !["link", "reauth"].includes(String(input.purpose))
    || !["email", "link"].includes(String(input.changeKind)) || typeof input.target !== "string" || input.target.length > 320) return json({}, 400);
  if (input.purpose === "link" && (input.changeKind !== "link" || input.target !== provider
    || typeof input.confirmationChallengeId !== "string" || !/^[0-9a-f-]{36}$/i.test(input.confirmationChallengeId)
    || typeof input.confirmationCode !== "string" || !/^\d{6}$/.test(input.confirmationCode))) return json({}, 400);
  const account = await currentAccount(request, input.scope);
  if (!account) return json({ message: "Потрібно увійти в акаунт знову." }, 401);
  try {
  const info = await providerInfo(provider);
  if (info.redirectUri !== `${siteOrigin(request)}/api/auth/external/${provider}/callback`) return accountErrorResponse(json({}, 503), null, account);
  const transaction: ExternalTransaction = { ...newTransaction(info, accountPath(input.scope), account.remember),
    purpose: input.purpose as "link" | "reauth", actorId: account.user.id, scope: input.scope,
    target: input.target, changeKind: input.changeKind as "email" | "link",
    ...(input.purpose === "link" ? { confirmationChallengeId: input.confirmationChallengeId as string, confirmationCode: input.confirmationCode as string } : {}) };
  const target = new URL(info.authorizationUrl);
  target.search = new URLSearchParams({ client_id: info.clientId, redirect_uri: info.redirectUri, response_type: "code", state: transaction.state,
    scope: info.scopes.join(provider === "google" ? " " : ",") }).toString();
  if (provider === "google") {
    target.searchParams.set("code_challenge", createHash("sha256").update(transaction.verifier).digest("base64url"));
    target.searchParams.set("code_challenge_method", "S256");
    target.searchParams.set("prompt", "select_account");
  }
  const response = json({ url: target.href });
  const { stateCookie } = await import("./external-auth");
  response.cookies.set(stateCookie(provider), encode(transaction), transientOptions);
  response.cookies.set(resultCookie, "", { ...transientOptions, maxAge: 0 });
  saveAccountRenewal(response, account);
  return response;
  } catch (error) { return accountErrorResponse(json({ message: "Не вдалося почати підтвердження." }, 503), error, account); }
}
export async function finishAccountOAuth(request: NextRequest, provider: ExternalProvider, transaction: ExternalTransaction) {
  const scope = transaction.scope!;
  let account: Awaited<ReturnType<typeof currentAccount>> = null;
  const fail = (error?: unknown) => accountErrorResponse(result(request, scope, transaction.actorId!, { message: "Не вдалося підтвердити обліковий запис. Почніть дію ще раз." }), error, account);
  try {
    account = await currentAccount(request, scope);
    if (!account || account.user.id !== transaction.actorId) return fail();
    if (request.nextUrl.searchParams.has("error")) {
      const response = result(request, scope, account.user.id, { message: "Підтвердження скасовано." });
      saveAccountRenewal(response, account); return response;
    }
    const code = request.nextUrl.searchParams.get("code");
    if (!code || code.length > 8192) return fail();
    const login = { provider, code, redirectUri: transaction.redirectUri, codeVerifier: transaction.verifier };
    const response = await backend(transaction.purpose === "link" ? "/api/auth/external/link/code" : "/api/auth/external/reauth/code", {
      method: "POST", headers: { Authorization: `Bearer ${account.token}` },
      body: JSON.stringify(transaction.purpose === "link" ? { login, confirmationChallengeId: transaction.confirmationChallengeId, confirmationCode: transaction.confirmationCode } : login),
    });
    const data = response.ok ? await response.json() : null;
    const output = data ? result(request, scope, account.user.id, transaction.purpose === "link"
      ? { linked: provider } : { challenge: data.challenge ?? null, target: transaction.target, changeKind: transaction.changeKind }) : fail();
    saveAccountRenewal(output, account);
    return output;
  } catch (error) { return fail(error); }
}
