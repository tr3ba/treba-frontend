import { NextRequest, NextResponse } from "next/server";
import { canOpenAdmin } from "../admin";
import { clearStaffSession, saveStaffSession } from "./staff-session";

const origin = (process.env.TREBA_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://treba.duckdns.org").replace(/\/+$/, "");
type Authentication = { accessToken: string; refreshToken: string; expiresAt: string; role?: string; roleName?: string };
const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/shop-api", maxAge: 7 * 86400 };
const refreshes = new Map<string, Promise<Authentication | null>>();

export function sameOrigin(request: NextRequest) {
  const value = request.headers.get("origin");
  try { return !!value && new URL(value).host === request.headers.get("host"); } catch { return false; }
}
export function saveSession(response: NextResponse, authentication: Authentication, remember = true) {
  const cookieOptions = remember ? options : { ...options, maxAge: undefined };
  response.cookies.set("treba_access", authentication.accessToken, cookieOptions);
  response.cookies.set("treba_refresh", authentication.refreshToken, cookieOptions);
  response.cookies.set("treba_expiry", authentication.expiresAt, cookieOptions);
  response.cookies.set("treba_remember", remember ? "1" : "0", cookieOptions);
}
export function clearSession(response: NextResponse) {
  for (const name of ["treba_access", "treba_refresh", "treba_expiry", "treba_remember"]) response.cookies.set(name, "", { ...options, maxAge: 0 });
}
const handoffOptions = { ...options, path: "/shop-api/admin-entry", maxAge: 60 };
export function clearAdminHandoff(response: NextResponse) {
  response.cookies.set("treba_staff_handoff", "", { ...handoffOptions, maxAge: 0 });
}
export function saveLoginSession(response: NextResponse, authentication: Authentication, remember = true) {
  if (canOpenAdmin(authentication.role ?? authentication.roleName)) {
    clearSession(response);
    // Workspace credentials have their own cookies and are never used by customer proxies.
    clearAdminHandoff(response);
    saveStaffSession(response, authentication, remember);
  } else {
    clearStaffSession(response);
    clearAdminHandoff(response);
    saveSession(response, authentication, remember);
  }
}
export function backend(path: string, init: RequestInit = {}) {
  return fetch(origin + path, { ...init, cache: "no-store", signal: AbortSignal.timeout(15000), headers: { Accept: "application/json", "Content-Type": "application/json", ...init.headers } });
}
export async function authenticated(request: NextRequest) {
  let token = request.cookies.get("treba_access")?.value;
  let renewed: Authentication | null = null;
  const expiry = Date.parse(request.cookies.get("treba_expiry")?.value ?? "");
  if (!token || !Number.isFinite(expiry) || expiry < Date.now() + 30000) {
    const refreshToken = request.cookies.get("treba_refresh")?.value;
    if (!refreshToken) return null;
    let pending = refreshes.get(refreshToken);
    if (!pending) {
      pending = backend("/api/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) })
        .then(async response => {
          if (response.status === 401 || response.status === 403) return null;
          if (!response.ok) throw new Error("Session service unavailable");
          return await response.json() as Authentication;
        });
      refreshes.set(refreshToken, pending);
      // Share a rotating refresh result between concurrent inbox/session requests.
      void pending.finally(() => { setTimeout(() => refreshes.delete(refreshToken), 5000).unref(); }).catch(() => {});
    }
    renewed = await pending;
    token = renewed?.accessToken;
  }
  return token ? { token, renewed, remember: request.cookies.get("treba_remember")?.value !== "0" } : null;
}
export function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "no-store, private" } });
}
