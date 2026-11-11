import { NextRequest, NextResponse } from "next/server";
import { authenticated, backend, saveSession } from "./session";
import { authenticatedStaff, saveStaffSession } from "./staff-session";
import { canOpenAdmin, canUseCustomerAccount } from "../admin";

export type AccountScope = "customer" | "staff";
export const accountPath = (scope: AccountScope) => scope === "staff" ? "/admin/profile" : "/account";
export const validScope = (value: unknown): value is AccountScope => value === "customer" || value === "staff";
type AccountSession = NonNullable<Awaited<ReturnType<typeof authenticated>>> & { scope: AccountScope };
export class AccountLookupError extends Error {
  constructor(public session: AccountSession) { super("Account service unavailable"); }
}
export async function currentAccount(request: NextRequest, scope: AccountScope) {
  const session = await (scope === "staff" ? authenticatedStaff(request) : authenticated(request));
  if (!session) return null;
  try {
    const response = await backend("/api/users/me", { headers: { Authorization: `Bearer ${session.token}` } });
    if (response.status >= 500) throw new AccountLookupError({ ...session, scope });
    if (!response.ok) return null;
    const user = await response.json();
    if (typeof user.id !== "string" || !(scope === "staff" ? canOpenAdmin(user.role ?? user.roleName) : canUseCustomerAccount(user.role ?? user.roleName))) return null;
    return { ...session, user, scope };
  } catch { throw new AccountLookupError({ ...session, scope }); }
}
export function saveAccountRenewal(response: NextResponse, account: AccountSession) {
  if (account.renewed) (account.scope === "staff" ? saveStaffSession : saveSession)(response, account.renewed, account.remember);
}
export function accountErrorResponse(response: NextResponse, error: unknown, account?: AccountSession | null) {
  const session = account ?? (error instanceof AccountLookupError ? error.session : null);
  if (session) saveAccountRenewal(response, session);
  return response;
}
export async function smallJson(request: NextRequest): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) { await reader.cancel(); throw new Error("Body too large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid body");
  return input;
}
