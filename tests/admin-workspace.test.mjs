import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import http from "node:http";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { createAdminFixture, ids } from "./helpers/admin-fixture.mjs";
import { avatarFixturePng } from "./helpers/avatar-fixture.mjs";
const dataUrl = (text) =>
  "data:text/javascript;base64," + Buffer.from(text).toString("base64");
async function compile(file) {
  return ts.transpileModule(
    await readFile(new URL("../src/" + file, import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.ESNext } },
  ).outputText;
}
test("admin transport only accepts explicit resources and methods", async () => {
  const { adminBackendPath } = await import(
    dataUrl(await compile("lib/server/admin-routes.ts"))
  );
  assert.equal(
    adminBackendPath("GET", "orders/" + ids.order),
    "/api/v1/admin/orders/" + ids.order,
  );
  assert.equal(adminBackendPath("PATCH", "profile"), "/api/users/me");
  for (const route of [
    "https://outside.test",
    "../auth",
    "catalog/../users",
    "catalog/%2e%2e/users",
    "support/unknown",
    "auth/login",
    "telegram/guard",
  ])
    assert.equal(adminBackendPath("POST", route), null);
  assert.equal(adminBackendPath("DELETE", "settings/staff"), null);
  assert.equal(adminBackendPath("PUT", "settings/features/notifications.sms-sending"), "/api/v1/admin/settings/features/notifications.sms-sending");
  assert.equal(adminBackendPath("PUT", "settings/features/notificationsXsms-sending"), null);
  assert.equal(adminBackendPath("PUT", "settings/features/supportXchat-deletion"), null);
});
test("calendar filters preserve the panel timezone across daylight-saving changes", async () => {
  const { adminDateBoundary } = await import(
    dataUrl(await compile("lib/server/admin-dates.ts"))
  );
  assert.equal(adminDateBoundary("2026-10-29"), "2026-10-28T22:00:00.000Z");
  assert.equal(
    adminDateBoundary("2026-07-01", true),
    "2026-07-01T21:00:00.000Z",
  );
  assert.equal(adminDateBoundary("2026-10-25"), "2026-10-24T21:00:00.000Z");
  assert.equal(
    adminDateBoundary("2026-10-25", true),
    "2026-10-25T22:00:00.000Z",
  );
});
test("category search retains ancestors and collapsed nodes use their actual depth", async () => {
  const { visibleCategories } = await import(
    dataUrl(await compile("features/admin/category-tree.ts"))
  );
  const leaf = { id: "leaf", name: "Навушники", children: [] };
  const child = { id: "child", name: "Аудіо", children: [leaf] };
  const root = { id: "root", name: "Електроніка", children: [child] };
  assert.equal(visibleCategories([root], new Set(), "").length, 1);
  assert.equal(visibleCategories([root], new Set(["root"]), "").length, 2);
  assert.deepEqual(
    visibleCategories([root], new Set(), "навуш").map((r) => [r.id, r.depth]),
    [
      ["root", 0],
      ["child", 1],
      ["leaf", 2],
    ],
  );
  assert.deepEqual(visibleCategories([root], new Set(), "unknown"), []);
});
test("workspace role matrix preserves seller and moderator boundaries", async () => {
  const redirect = dataUrl(await compile("lib/redirect.ts"));
  const admin = dataUrl(
    (await compile("lib/admin.ts")).replace(
      'from "./redirect"',
      `from "${redirect}"`,
    ),
  );
  const { canAccessAdmin } = await import(
    dataUrl(
      (await compile("lib/admin-access.ts")).replace(
        'from "./admin"',
        `from "${admin}"`,
      ),
    )
  );
  for (const role of ["Administrator", "Manager", "Moderator", "Seller"]) {
    assert.equal(canAccessAdmin(role, "/admin"), true);
    assert.equal(canAccessAdmin(role, "/admin/profile"), true);
  }
  assert.equal(canAccessAdmin("Customer", "/admin"), false);
  assert.equal(canAccessAdmin("Seller", "/admin/products/import"), true);
  for (const route of [
    "/admin/users",
    "/admin/settings",
    "/admin/moderation",
    "/admin/support/trash",
    "/admin/loyalty",
  ])
    assert.equal(canAccessAdmin("Seller", route), false);
  assert.equal(canAccessAdmin("Moderator", "/admin/orders"), false);
  assert.equal(canAccessAdmin("Manager", "/admin/settings/staff"), false);
});
test(
  "production workspace sessions, proxy operations and customer isolation",
  { timeout: 120000 },
  async (t) => {
    const fixture = createAdminFixture();
    fixture.server.listen(0, "127.0.0.1");
    await once(fixture.server, "listening");
    const reserve = http.createServer();
    reserve.listen(0, "127.0.0.1");
    await once(reserve, "listening");
    const port = reserve.address().port;
    await new Promise((resolve) => reserve.close(resolve));
    const origin = `http://127.0.0.1:${port}`,
      api = `http://127.0.0.1:${fixture.server.address().port}`;
    const child = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        String(port),
      ],
      {
        windowsHide: true,
        env: {
          ...process.env,
          NODE_ENV: "production",
          TREBA_API_URL: api,
          NEXT_PUBLIC_API_URL: api,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let output = "";
    for (const stream of [child.stdout, child.stderr])
      stream.on("data", (data) => {
        output = (output + data).slice(-3000);
      });
    t.after(async () => {
      child.kill("SIGTERM");
      fixture.server.closeAllConnections();
      await new Promise((resolve) => fixture.server.close(resolve));
    });
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch(origin + "/admin-api/session")).status === 401) break;
      } catch {}
      if (i === 99) assert.fail(output);
      await delay(300);
    }
    const request = (path, cookie, method = "GET", body, from = origin) =>
      fetch(origin + path, {
        method,
        headers: {
          Origin: from,
          ...(cookie ? { Cookie: cookie } : {}),
          ...(body && !(body instanceof FormData)
            ? { "Content-Type": "application/json" }
            : {}),
        },
        body:
          body === undefined
            ? undefined
            : body instanceof FormData
              ? body
              : JSON.stringify(body),
        redirect: "manual",
      });
    const jar = (response) =>
      response.headers
        .getSetCookie()
        .filter((c) => !/Max-Age=0/i.test(c))
        .map((c) => c.split(";")[0])
        .join("; ");
    let cookie;
    await t.test(
      "staff login returns a profile and isolated HttpOnly cookies",
      async () => {
        const response = await request("/shop-api/session", null, "POST", {
          action: "login",
          email: "Administrator@example.test",
          password: "fixture-only",
        });
        assert.equal(response.status, 200);
        assert.ok(!(await response.text()).includes("fixture-Administrator"));
        cookie = jar(response);
        assert.match(cookie, /treba_staff_access=/);
        assert.ok(!cookie.includes("treba_access="));
        for (const c of response.headers
          .getSetCookie()
          .filter(
            (c) => c.startsWith("treba_staff_") && !/Max-Age=0/i.test(c),
          )) {
          assert.match(c, /HttpOnly/);
          assert.match(c, /Secure/);
          assert.match(c, /SameSite=lax/i);
          assert.match(c, /Path=\//);
        }
        assert.equal((await request("/admin-api/session", cookie)).status, 200);
        assert.equal((await request("/shop-api/session", cookie)).status, 401);
        assert.equal((await request("/shop-api/support", cookie)).status, 401);
      },
    );
    await t.test(
      "workspace documents expose a stable deployment marker",
      async () => {
        for (const path of ["/admin", "/admin/products", "/admin/settings"]) {
          const response = await request(path, cookie);
          assert.equal(response.status, 200);
          assert.match(await response.text(), /data-treba-workspace="loading"/);
        }
      },
    );
    await t.test(
      "workspace language survives a fresh document request",
      async () => {
        const response = await request(
          "/admin",
          cookie + "; treba_workspace_language=en",
        );
        const html = await response.text();
        assert.equal(response.status, 200);
        assert.match(html, /lang="en" class="treba-admin-locale"/);
        assert.match(html, /TREBA · Workspace/);
        assert.match(html, /aria-label="Interface language"/);
      },
    );
    await t.test(
      "the profile language is saved through the existing profile endpoint",
      async () => {
        const profile = await (
          await request("/admin-api/profile", cookie)
        ).json();
        const response = await request("/admin-api/profile", cookie, "PATCH", {
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          language: "en",
          marketingEmailsEnabled: false,
        });
        assert.equal(response.status, 200);
        assert.equal((await response.json()).profile.language, "en");
        const session = await (
          await request("/admin-api/session", cookie)
        ).json();
        assert.equal(session.user.profile.language, "en");
      },
    );
    await t.test("all migrated read resources are reachable", async () => {
      for (const path of [
        "dashboard",
        "operations/metrics",
        "catalog/products",
        "catalog/products/" + ids.product,
        "catalog/filter-options",
        "catalog/attributes?categoryId=" + ids.category,
        "orders",
        "orders/" + ids.order,
        "support",
        "support/" + ids.ticket,
        "support/deleted",
        "sellers",
        "sellers/" + ids.seller,
        "seller-applications",
        "reviews",
        "reviews/pending-count",
        "reviews/reply-templates",
        "settings/review-replies",
        "operations/customers",
        "operations/customers/" + ids.user,
        "promotions",
        "promotions/" + ids.promotion,
        "users",
        "users/" + ids.user,
        "settings/staff",
        "settings/features",
        "settings/audit",
        "telegram/mappings",
        "profile",
        "security",
        "telegram-account/link",
        "notifications",
      ]) {
        const response = await request("/admin-api/" + path, cookie);
        assert.equal(
          response.status,
          200,
          path + ": " + (await response.text()),
        );
      }
      const page = await fetch(origin + "/admin");
      assert.equal(page.status, 200);
      const html = await page.text();
      assert.ok(!html.includes("fixture-Administrator"));
      assert.ok(!html.includes("MobileTabBar"));
    });
    await t.test(
      "mutations require the current origin and preserve version conflicts",
      async () => {
        assert.equal(
          (
            await request(
              "/admin-api/orders/" + ids.order + "/status",
              cookie,
              "PATCH",
              { status: "CONFIRMED", expectedVersion: "v1" },
              "https://outside.test",
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await request(
              "/admin-api/orders/" + ids.order + "/status",
              cookie,
              "PATCH",
              { status: "CONFIRMED", expectedVersion: "stale" },
            )
          ).status,
          409,
        );
        assert.equal(
          (
            await request(
              "/admin-api/orders/" + ids.order + "/status",
              cookie,
              "PATCH",
              {
                status: "CONFIRMED",
                expectedVersion: "v1",
                reason: "Test transition",
              },
            )
          ).status,
          204,
        );
        const message = {
          message: "Тестова відповідь",
          internal: true,
          clientMessageId: ids.product,
        };
        assert.equal(
          (
            await request(
              "/admin-api/support/" + ids.ticket + "/messages",
              cookie,
              "POST",
              message,
            )
          ).status,
          204,
        );
        assert.deepEqual(
          fixture.calls.findLast((c) => c.path.endsWith("/messages")).body,
          message,
        );
      },
    );
    await t.test(
      "multipart photos retain their boundary and form field names",
      async () => {
        const form = new FormData();
        form.append(
          "file",
          new Blob(["test-image"], { type: "image/png" }),
          "photo.png",
        );
        form.append("isMain", "true");
        form.append("sortOrder", "0");
        assert.equal(
          (
            await request(
              `/admin-api/products/${ids.product}/images/upload`,
              cookie,
              "POST",
              form,
            )
          ).status,
          200,
        );
        const call = fixture.calls.findLast((c) =>
          c.path.endsWith("/images/upload"),
        );
        assert.match(call.contentType, /multipart\/form-data; boundary=/);
        assert.ok(call.bytes > 10);
      },
    );
    await t.test("profile avatar uploads update the session and deletion restores the fallback", async () => {
      const image = avatarFixturePng(512, 512);
      const form = new FormData();
      form.append("avatar", new Blob([image], { type: "image/png" }), "profile-avatar.png");
      const response = await request("/admin-api/profile/avatar", cookie, "POST", form);
      assert.equal(response.status, 200);
      const user = await response.json();
      assert.ok(user.profile.avatarUrl);
      const call = fixture.calls.findLast(c => c.path === "/api/users/me/avatar");
      assert.equal(call.authorization, "Bearer fixture-Administrator");
      assert.match(call.contentType, /multipart\/form-data; boundary=/);
      assert.deepEqual(call.upload, { name: "profile-avatar.png", type: "image/png", bytes: image.length });
      const session = await (await request("/admin-api/session", cookie)).json();
      assert.equal(session.user.profile.avatarUrl, user.profile.avatarUrl);
      assert.deepEqual(Buffer.from(await (await fetch(user.profile.avatarUrl)).arrayBuffer()), image);
      const removed = await request("/admin-api/profile/avatar", cookie, "DELETE");
      assert.equal(removed.status, 200);
      assert.equal((await removed.json()).profile.avatarUrl, null);
      assert.equal((await (await request("/admin-api/session", cookie)).json()).user.profile.avatarUrl, null);
    });
    await t.test("TurboSMS can be enabled, survives reload, and rejects stale feature versions", async () => {
      const get = async () => (await (await request("/admin-api/settings/features", cookie)).json()).find(row => row.key === "notifications.sms-sending");
      const initial = await get(); assert.equal(initial.enabled, false);
      const enabled = await request("/admin-api/settings/features/notifications.sms-sending", cookie, "PUT", { enabled: true, expectedVersion: initial.version });
      assert.equal(enabled.status, 200); assert.equal((await get()).enabled, true);
      assert.equal((await request("/admin-api/settings/features/notifications.sms-sending", cookie, "PUT", { enabled: false, expectedVersion: initial.version })).status, 409);
      const current = await get();
      assert.equal((await request("/admin-api/settings/features/notifications.sms-sending", cookie, "PUT", { enabled: false, expectedVersion: current.version })).status, 200);
      assert.equal((await get()).enabled, false);
    });
    await t.test("review templates and edited replies cross the authenticated proxy with their versions intact", async () => {
      const body = { name: "Transport fixture", textUk: "Дякуємо, {customer}!", textEn: "Thank you, {customer}!", enabled: true };
      const createdResponse = await request("/admin-api/settings/review-replies", cookie, "POST", body);
      assert.equal(createdResponse.status, 200);
      const created = await createdResponse.json();
      const updated = await request("/admin-api/settings/review-replies/" + created.id, cookie, "PUT", { ...body, enabled: false, expectedVersion: created.version });
      assert.equal(updated.status, 200);
      assert.notEqual((await updated.json()).version, created.version);
      assert.equal((await request("/admin-api/settings/review-replies/" + created.id, cookie, "PUT", { ...body, expectedVersion: created.version })).status, 409);
      const active = await (await request("/admin-api/reviews/reply-templates", cookie)).json();
      assert.ok(active.every(row => row.id !== created.id));
      const decision = { status: "PUBLISHED", reply: "Edited customer reply" };
      assert.equal((await request(`/admin-api/reviews/${ids.product}/moderate`, cookie, "PUT", decision)).status, 204);
      assert.deepEqual(fixture.calls.findLast(call => call.path.endsWith("/moderate")).body, decision);
      const published = await (await request("/admin-api/reviews?status=PUBLISHED", cookie)).json();
      assert.equal(published.content[0].staffReply, decision.reply);
      assert.equal(await (await request("/admin-api/reviews/pending-count", cookie)).json(), 0);
    });
    await t.test("support inbox retains history and versioned trash/restore operations through the proxy", async () => {
      const id = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
      const created = await request("/admin-api/support", cookie, "POST", { subject: "Support lifecycle", message: "Delivery question", kind: "QUESTION", orderId: ids.order, clientRequestId: id });
      assert.equal(created.status, 200);
      assert.equal((await created.json()).summary.id, id);
      const path = "/admin-api/support/" + id;
      const original = await (await request(path, cookie)).json();
      assert.equal((await request(path + "/read", cookie, "POST", { messageId: original.messages[0].id })).status, 204);
      const failed = await request(path + "/messages", cookie, "POST", { message: "fixture-error", clientMessageId: ids.product });
      assert.equal(failed.status, 503);
      assert.equal((await (await request(path, cookie)).json()).messages.length, 1);
      assert.equal((await request(path + "/messages", cookie, "POST", { message: "Internal draft preserved", internal: true, clientMessageId: ids.product })).status, 204);
      const replied = await (await request(path, cookie)).json();
      assert.equal(replied.messages.at(-1).internal, true);
      assert.equal((await request(path + "/status", cookie, "PATCH", { status: "CLOSED", expectedVersion: original.summary.version })).status, 409);
      assert.equal((await request(path + "/status", cookie, "PATCH", { status: "CLOSED", expectedVersion: replied.summary.version })).status, 204);
      const closed = await (await request(path, cookie)).json();
      assert.equal(closed.summary.status, "CLOSED");
      assert.equal((await request(path, cookie, "DELETE", { expectedVersion: closed.summary.version })).status, 204);
      assert.equal((await request(path, cookie)).status, 404);
      const deleted = await (await request("/admin-api/support/deleted?search=Support", cookie)).json();
      assert.equal(deleted.content.length, 1);
      assert.equal(deleted.content[0].id, id);
      assert.equal((await request(path + "/restore", cookie, "POST", { expectedVersion: deleted.content[0].version })).status, 204);
      const restored = await (await request(path, cookie)).json();
      assert.equal(restored.messages.length, closed.messages.length);
      assert.equal(restored.summary.status, "CLOSED");
    });
    await t.test(
      "unknown paths and methods never reach the upstream API",
      async () => {
        for (const path of [
          "auth/logout",
          "support/unknown",
          "settings/unknown",
          "https:outside.test",
        ])
          assert.equal(
            (await request("/admin-api/" + path, cookie, "DELETE")).status,
            404,
          );
        assert.equal(
          (await request("/admin-api/settings/staff", cookie, "DELETE")).status,
          404,
        );
      },
    );
    await t.test(
      "customer and staff cookies cannot substitute for one another",
      async () => {
        const customer = await request("/shop-api/session", null, "POST", {
          action: "login",
          email: "Customer@example.test",
          password: "fixture-only",
        });
        assert.equal(
          (await request("/admin-api/session", jar(customer))).status,
          401,
        );
        const forged =
          "treba_staff_access=fixture-Customer; treba_staff_expiry=" +
          encodeURIComponent(new Date(Date.now() + 3600000).toISOString());
        assert.equal((await request("/admin-api/session", forged)).status, 403);
        const manager = await request("/shop-api/session", null, "POST", {
          action: "login",
          email: "Manager@example.test",
          password: "fixture-only",
        });
        assert.equal(
          (await request("/admin-api/settings/staff", jar(manager))).status,
          403,
        );
        const seller = await request("/shop-api/session", null, "POST", {
          action: "login",
          email: "Seller@example.test",
          password: "fixture-only",
        });
        assert.equal(
          (await request("/admin-api/imports/options", jar(seller))).status,
          200,
        );
      },
    );
    await t.test(
      "concurrent staff refreshes share one rotation and logout clears the session",
      async () => {
        const expired = await request("/shop-api/session", null, "POST", {
          action: "login",
          email: "Manager@example.test",
          password: "expired",
        });
        const old = jar(expired),
          before = fixture.calls.filter(
            (c) => c.path === "/api/auth/refresh",
          ).length;
        const responses = await Promise.all([
          request("/admin-api/session", old),
          request("/admin-api/catalog/stats", old),
        ]);
        assert.ok(responses.every((r) => r.status === 200));
        assert.equal(
          fixture.calls.filter((c) => c.path === "/api/auth/refresh").length -
            before,
          1,
        );
        const logout = await request("/admin-api/logout", cookie, "POST");
        assert.equal(logout.status, 200);
        assert.ok(
          logout.headers.getSetCookie().every((c) => /Max-Age=0/i.test(c)),
        );
        assert.equal(
          (await request("/admin-api/logout", null, "POST")).status,
          200,
        );
      },
    );
  },
);
