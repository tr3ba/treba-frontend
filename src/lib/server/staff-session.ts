import { NextRequest, NextResponse } from "next/server";
import { backend } from "./session";

export type StaffAuthentication = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  role?: string;
  roleName?: string;
};
const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 86400,
};
const refreshes = new Map<string, Promise<StaffAuthentication | null>>();
export function saveStaffSession(
  response: NextResponse,
  auth: StaffAuthentication,
  remember = true,
) {
  const cookie = remember ? options : { ...options, maxAge: undefined };
  for (const [key, value] of Object.entries({
    access: auth.accessToken,
    refresh: auth.refreshToken,
    expiry: auth.expiresAt,
    remember: remember ? "1" : "0",
  }))
    response.cookies.set(`treba_staff_${key}`, value, cookie);
}
export function clearStaffSession(response: NextResponse) {
  for (const key of ["access", "refresh", "expiry", "remember"])
    response.cookies.set(`treba_staff_${key}`, "", { ...options, maxAge: 0 });
}
export async function authenticatedStaff(request: NextRequest) {
  let token = request.cookies.get("treba_staff_access")?.value;
  let renewed: StaffAuthentication | null = null;
  const expiry = Date.parse(
    request.cookies.get("treba_staff_expiry")?.value ?? "",
  );
  if (!token || !Number.isFinite(expiry) || expiry < Date.now() + 30000) {
    const refresh = request.cookies.get("treba_staff_refresh")?.value;
    if (!refresh) return null;
    let pending = refreshes.get(refresh);
    if (!pending) {
      pending = backend("/api/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: refresh }),
      }).then(async (response) => {
        if ([401, 403].includes(response.status)) return null;
        if (!response.ok) throw new Error("Session service unavailable");
        return (await response.json()) as StaffAuthentication;
      });
      refreshes.set(refresh, pending);
      void pending
        .finally(() => {
          setTimeout(() => refreshes.delete(refresh), 5000).unref();
        })
        .catch(() => {});
    }
    renewed = await pending;
    token = renewed?.accessToken;
  }
  return token
    ? {
        token,
        renewed,
        remember: request.cookies.get("treba_staff_remember")?.value !== "0",
      }
    : null;
}
