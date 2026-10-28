import { randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSafeNextPath } from "../redirect";
import { backend } from "./session";

export type ExternalProvider = "google" | "facebook";
export type ProviderInfo = { name: ExternalProvider; clientId: string; authorizationUrl: string; scopes: string[]; redirectUri: string };
export type ExternalTransaction = { state: string; verifier: string; redirectUri: string; next: string; remember: boolean; expires: number };
const prefix = process.env.NODE_ENV === "production" ? "__Host-" : "";
export const resultCookie = prefix + "treba_external_result";
export const transientOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 600 };
export const stateCookie = (provider: ExternalProvider) => prefix + "treba_oauth_" + provider;
export const isProvider = (value: string): value is ExternalProvider => value === "google" || value === "facebook";
export const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
export function decode(value?: string): unknown {
  try { return value && value.length < 6000 ? JSON.parse(Buffer.from(value, "base64url").toString()) : null; } catch { return null; }
}
export function siteOrigin(request: NextRequest) {
  if (process.env.TREBA_STORE_ORIGIN) return new URL(process.env.TREBA_STORE_ORIGIN).origin;
  const host = request.headers.get("host") ?? request.nextUrl.host;
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  return new URL(`${local ? "http" : "https"}://${host}`).origin;
}
export function redirect(url: URL | string) {
  return NextResponse.redirect(url, { status: 303, headers: { "Cache-Control": "no-store, private", "Referrer-Policy": "no-referrer" } });
}
export function loginResult(request: NextRequest, next: string | undefined, value: unknown) {
  const target = new URL("/login", siteOrigin(request));
  target.searchParams.set("external", "1");
  target.searchParams.set("next", getSafeNextPath(next));
  const response = redirect(target);
  response.cookies.set(resultCookie, encode({ ...Object(value), expires: Date.now() + 600000 }), transientOptions);
  return response;
}
export async function providerInfo(provider: ExternalProvider) {
  const response = await backend("/api/auth/external/providers");
  if (!response.ok) throw new Error("Вхід через соцмережі тимчасово недоступний. Спробуйте пізніше.");
  const providers: ProviderInfo[] = await response.json();
  const info = providers.find(item => item.name === provider);
  if (!info) throw new Error(`Вхід через ${provider === "google" ? "Google" : "Facebook"} тимчасово недоступний.`);
  const expected = provider === "google" ? "https://accounts.google.com/o/oauth2/v2/auth" : "https://www.facebook.com/dialog/oauth";
  if (info.authorizationUrl !== expected || !info.clientId || !Array.isArray(info.scopes)) throw new Error("Не вдалося почати вхід.");
  return info;
}
export function newTransaction(info: ProviderInfo, next: string | null, remember: boolean): ExternalTransaction {
  return { state: randomBytes(32).toString("base64url"), verifier: randomBytes(32).toString("base64url"),
    redirectUri: info.redirectUri, next: getSafeNextPath(next), remember, expires: Date.now() + 600000 };
}
export function readTransaction(request: NextRequest, provider: ExternalProvider): ExternalTransaction | null {
  const data = decode(request.cookies.get(stateCookie(provider))?.value) as Partial<ExternalTransaction> | null;
  const state = request.nextUrl.searchParams.get("state");
  if (!data || !state || typeof data.state !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(data.state) || !/^[A-Za-z0-9_-]{43}$/.test(state)
    || typeof data.verifier !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(data.verifier)
    || typeof data.redirectUri !== "string" || typeof data.expires !== "number" || data.expires < Date.now()
    || !timingSafeEqual(Buffer.from(state), Buffer.from(data.state))) return null;
  const uri = new URL(data.redirectUri);
  if (uri.origin !== siteOrigin(request) || uri.pathname !== `/api/auth/external/${provider}/callback` || uri.search || uri.hash) return null;
  return { ...data, next: getSafeNextPath(data.next), remember: data.remember !== false } as ExternalTransaction;
}
