import { NextRequest, NextResponse } from "next/server";
import { backend, json, sameOrigin } from "@/lib/server/session";
import {
  authenticatedStaff,
  clearStaffSession,
  saveStaffSession,
} from "@/lib/server/staff-session";
import { adminBackendPath } from "@/lib/server/admin-routes";
import { canOpenAdmin } from "@/lib/admin";
import { adminDateBoundary } from "@/lib/server/admin-dates";

export const runtime = "nodejs";
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ segments?: string[] }> },
) {
  if (request.method !== "GET" && !sameOrigin(request)) return json({}, 403);
  const { segments = [] } = await context.params;
  const resource = segments.join("/");
  const logout = resource === "logout" && request.method === "POST";
  const path = adminBackendPath(request.method, resource);
  if (!path && !logout) return json({}, 404);
  try {
    const session = await authenticatedStaff(request);
    if (!session) {
      const response = logout
        ? json({ ok: true })
        : json({ message: "Сеанс завершився. Увійдіть знову." }, 401);
      clearStaffSession(response);
      return response;
    }
    const authorization = { Authorization: `Bearer ${session.token}` };
    if (logout) {
      try {
        await backend("/api/auth/logout", {
          method: "POST",
          headers: authorization,
          body: JSON.stringify({
            refreshToken:
              session.renewed?.refreshToken ??
              request.cookies.get("treba_staff_refresh")?.value,
          }),
        });
      } finally {
        /* The local session is cleared even when the API is unavailable. */
      }
      const response = json({ ok: true });
      clearStaffSession(response);
      return response;
    }
    const profile = await backend("/api/users/me", { headers: authorization });
    if (!profile.ok) {
      const response = json(
        { message: "Не вдалося перевірити доступ." },
        profile.status,
      );
      if ([401, 403, 404].includes(profile.status)) clearStaffSession(response);
      return response;
    }
    const user = await profile.json();
    if (!canOpenAdmin(user.role ?? user.roleName)) {
      const response = json({}, 403);
      clearStaffSession(response);
      return response;
    }
    if (resource === "session") {
      const response = json({ user });
      if (session.renewed)
        saveStaffSession(response, session.renewed, session.remember);
      return response;
    }
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...authorization,
    };
    let body: BodyInit | undefined;
    if (!["GET", "HEAD"].includes(request.method)) {
      const multipart = request.headers
        .get("content-type")
        ?.startsWith("multipart/form-data");
      const limit = multipart ? 6 * 1024 * 1024 : 1024 * 1024;
      if (Number(request.headers.get("content-length") ?? 0) > limit)
        return json({}, 413);
      const bytes = await request.arrayBuffer();
      if (bytes.byteLength > limit) return json({}, 413);
      body = bytes;
      headers["Content-Type"] =
        request.headers.get("content-type") ?? "application/json";
    }
    const query = new URLSearchParams();
    for (const key of [
      "page",
      "size",
      "search",
      "status",
      "sort",
      "categoryId",
      "brandId",
      "sellerId",
      "minPrice",
      "maxPrice",
      "stock",
      "waitingHours",
      "days",
      "from",
      "to",
      "customerId",
      "kind",
      "view",
      "before",
      "orderId",
      "productId",
      "role",
      "entityType",
      "action",
      "resetCategory",
      "excludeId",
      "manufacturerPartNumber",
      "barcode",
    ]) {
      const value = request.nextUrl.searchParams.get(key);
      if (value !== null)
        query.set(
          key,
          key === "from" || key === "to"
            ? adminDateBoundary(value, key === "to")
            : value,
        );
    }
    const result = await backend(path! + (query.size ? "?" + query : ""), {
      method: request.method,
      headers,
      body,
    });
    const response = new NextResponse(
      result.status === 204 ? null : await result.text(),
      {
        status: result.status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, private",
        },
      },
    );
    if (session.renewed)
      saveStaffSession(response, session.renewed, session.remember);
    if (result.status === 401) clearStaffSession(response);
    return response;
  } catch {
    const response = json(
      { message: "Сервіс тимчасово недоступний. Спробуйте ще раз." },
      503,
    );
    if (logout) clearStaffSession(response);
    return response;
  }
}
export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
