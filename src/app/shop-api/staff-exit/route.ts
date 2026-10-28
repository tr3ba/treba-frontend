import { NextRequest, NextResponse } from "next/server";
import { adminOrigin } from "../../../lib/admin";
import { authenticated, backend, clearAdminHandoff, clearSession, json } from "../../../lib/server/session";
import { resultCookie, transientOptions } from "../../../lib/server/external-auth";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const expected = new URL(process.env.TREBA_ADMIN_ORIGIN ?? adminOrigin).origin;
  if (request.headers.get("origin") !== expected) return json({}, 403);
  try {
    const session = await authenticated(request);
    if (session) await backend("/api/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ refreshToken: session.renewed?.refreshToken ?? request.cookies.get("treba_refresh")?.value }) });
  } catch { /* The browser still leaves both workspaces signed out if the old session has expired. */ }
  const response = new NextResponse(null, { status: 303, headers: { Location: "/", "Cache-Control": "no-store, private", "Referrer-Policy": "no-referrer" } });
  clearSession(response); clearAdminHandoff(response);
  response.cookies.set(resultCookie, "", { ...transientOptions, maxAge: 0 });
  return response;
}
