import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

test("support session uses real server authentication without exposing credentials", { timeout: 120000 }, async t => {
  let refreshCount = 0;
  let preferences = { values: { firstName: "Test", lastName: "Customer", addressCity: "Kyiv" }, version: "preferences-v1" };
  let application = null;
  const notification = { key: "message:fixture", title: "Support message", text: "Fixture message", scope: "shop", path: "/account/messages?ticket=fixture", createdAt: new Date().toISOString(), read: false };
  const authentication = (expired = false, role = "Customer") => ({ userId: "fixture-customer", firstName: "Test", lastName: "Customer", email: "customer@example.test", role, accessToken: role !== "Customer" ? "fixture-staff" : "fixture-access", refreshToken: "fixture-refresh", expiresAt: new Date(Date.now() + (expired ? -1000 : 3600000)).toISOString() });
  const backend = http.createServer(async (request, response) => {
    let body = ""; for await (const part of request) body += part;
    response.setHeader("Content-Type", "application/json");
    if (request.url === "/api/auth/login") {
      if (body.includes("challenge")) { response.end(JSON.stringify({ challenge: { challengeId: "fixture-challenge", methods: ["authenticator", "email", "telegram"], maskedEmail: "t***@example.test", expiresAt: new Date(Date.now() + 60000).toISOString() } })); return; }
      const role = ["Administrator", "Manager", "Moderator", "Seller"].find(value => JSON.parse(body).email === value + "@example.test") ?? (body.includes("staff") ? "Manager" : "Customer");
      response.end(JSON.stringify({ authentication: authentication(body.includes("expired"), role) })); return;
    }
    if (request.url === "/api/auth/2fa/email/send") { assert.equal(JSON.parse(body).challengeId, "fixture-challenge"); response.writeHead(204); response.end(); return; }
    if (request.url === "/api/auth/2fa/verify") {
      const input = JSON.parse(body);
      if (input.code !== "123456") { response.writeHead(401); response.end("{}"); return; }
      assert.equal(input.challengeId, "fixture-challenge"); assert.ok(["email", "authenticator"].includes(input.method));
      response.end(JSON.stringify({ authentication: authentication(false, "Manager") })); return;
    }
    if (request.url === "/api/telegram/guard") { assert.equal(JSON.parse(body).loginChallengeId, "fixture-challenge"); response.end(JSON.stringify({ id: "fixture-guard", browserSecret: "fixture-browser-secret", qrCodeDataUrl: "data:image/png;base64,fixture", displayCode: "123456" })); return; }
    if (request.url === "/api/telegram/guard/status") { assert.equal(JSON.parse(body).browserSecret, "fixture-browser-secret"); response.end(JSON.stringify({ status: "approved" })); return; }
    if (request.url === "/api/telegram/guard/complete") { assert.equal(JSON.parse(body).browserSecret, "fixture-browser-secret"); response.end(JSON.stringify({ authentication: authentication(false, "Manager") })); return; }
    if (request.url === "/api/auth/register") { assert.equal(JSON.parse(body).roleName, "Customer"); response.end(JSON.stringify(authentication())); return; }
    if (request.url === "/api/auth/refresh") { refreshCount++; await delay(100); response.end(JSON.stringify(authentication())); return; }
    if (!["Bearer fixture-access", "Bearer fixture-staff"].includes(request.headers.authorization)) { response.writeHead(401); response.end("{}"); return; }
    if (request.url === "/api/auth/admin-entry") { if (request.headers.authorization !== "Bearer fixture-staff") response.writeHead(403); response.end(JSON.stringify({ code: "one-time-admin-code", expiresAt: new Date(Date.now() + 60000).toISOString() })); return; }
    if (request.url === "/api/users/me") { response.end(JSON.stringify({ id: "fixture-customer", firstName: "Test", lastName: "Customer", email: "customer@example.test", phone: "+380000000000", role: request.headers.authorization === "Bearer fixture-staff" ? "Manager" : "Customer" })); return; }
    if (request.url === "/api/auth/logout") { response.writeHead(204); response.end(); return; }
    if (request.url === "/api/v1/account/preferences") {
      if (request.method === "PATCH") { const input = JSON.parse(body); assert.equal(input.version, preferences.version); preferences = { values: { ...preferences.values, ...input.values }, version: "preferences-v2" }; }
      response.end(JSON.stringify(preferences)); return;
    }
    if (request.url.startsWith("/api/v1/account/orders")) {
      response.end(JSON.stringify({ content: [{ id: "fixture-order", orderNumber: "ORDER-1", status: "PAID", items: [] }], page: 1, totalElements: 1, totalPages: 1 })); return;
    }
    if (request.url === "/api/v1/account/seller-application") {
      if (request.method === "POST") { application = { ...JSON.parse(body), id: "fixture-application", status: "pending", createdAt: new Date().toISOString() }; response.end(JSON.stringify(application)); }
      else response.end(JSON.stringify({ application })); return;
    }
    if (request.url === "/api/v1/account/notifications") { response.end(JSON.stringify({ items: [notification], unreadCount: notification.read ? 0 : 1 })); return; }
    if (request.url === "/api/v1/account/notifications/read") { assert.deepEqual(JSON.parse(body).keys, [notification.key]); notification.read = true; response.writeHead(204); response.end(); return; }
    if (request.url.startsWith("/api/v1/support")) { response.end(JSON.stringify({ content: [], page: 1, totalPages: 0 })); return; }
    response.writeHead(404); response.end("{}");
  });
  backend.listen(0, "127.0.0.1"); await once(backend, "listening");
  const reserve = http.createServer(); reserve.listen(0, "127.0.0.1"); await once(reserve, "listening"); const port = reserve.address().port; await new Promise(resolve => reserve.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  const backendOrigin = `http://127.0.0.1:${backend.address().port}`;
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], { windowsHide: true, env: { ...process.env, NODE_ENV: "production", TREBA_API_URL: backendOrigin, NEXT_PUBLIC_API_URL: backendOrigin }, stdio: ["ignore", "pipe", "pipe"] });
  let output = ""; for (const pipe of [child.stdout, child.stderr]) pipe.on("data", data => { output = (output + data).slice(-4000); });
  t.after(async () => { child.kill("SIGTERM"); backend.closeAllConnections(); await new Promise(resolve => backend.close(resolve)); });
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    try { if ((await fetch(origin + "/shop-api/session")).status === 401) { ready = true; break; } } catch {}
    await delay(500);
  }
  assert.ok(ready, output);
  const post = (path, data, cookie, from = origin) => fetch(origin + path, { method: "POST", headers: { Origin: from, "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(data) });
  const cookieJar = response => response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  await t.test("cross-site requests are rejected", async () => { assert.equal((await post("/shop-api/session", { action: "login" }, null, "https://untrusted.example")).status, 403); });
  let cookie;
  await t.test("login only exposes the customer profile and sets HttpOnly cookies", async () => {
    const response = await post("/shop-api/session", { action: "login", email: "customer@example.test", password: "fixture-only" });
    assert.equal(response.status, 200); const body = await response.text(); assert.ok(body.includes("fixture-customer")); assert.ok(!body.includes("fixture-access")); assert.ok(!body.includes("refreshToken"));
    for (const value of response.headers.getSetCookie().filter(c => !/Max-Age=0/i.test(c))) { assert.match(value, /HttpOnly/i); assert.match(value, /SameSite=lax/i); assert.match(value, /Path=\/shop-api/i); }
    cookie = cookieJar(response);
  });
  await t.test("profile and support require a valid session", async () => {
    assert.equal((await fetch(origin + "/shop-api/support")).status, 401);
    const profile = await fetch(origin + "/shop-api/session", { headers: { Cookie: cookie } }); assert.equal(profile.status, 200); assert.equal((await profile.json()).user.phone, "+380000000000");
    assert.equal((await fetch(origin + "/shop-api/support", { headers: { Cookie: cookie } })).status, 200);
    assert.equal((await post("/shop-api/support", { internal: true }, cookie)).status, 403);
    assert.equal((await fetch(origin + "/shop-api/support/invalid-path", { headers: { Cookie: cookie } })).status, 404);
  });
  await t.test("remember-me off uses browser-session cookies", async () => {
    const response = await post("/shop-api/session", { action: "login", email: "customer@example.test", password: "fixture-only", remember: false });
    assert.equal(response.status, 200); assert.ok(response.headers.getSetCookie().filter(value => !/Max-Age=0/i.test(value)).every(value => !/Max-Age=/i.test(value)));
  });
  await t.test("account proxy keeps preferences, applications and notification receipts on the server", async () => {
    assert.equal((await fetch(origin + "/shop-api/account/preferences")).status, 401);
    const request = (path, options = {}) => fetch(origin + "/shop-api/account/" + path, { ...options, headers: { Cookie: cookie, Origin: origin, "Content-Type": "application/json", ...options.headers } });
    const saved = await request("preferences", { method: "PATCH", body: JSON.stringify({ values: { addressCity: "Lviv" }, version: "preferences-v1" }) });
    assert.equal(saved.status, 200); assert.match(saved.headers.get("cache-control"), /no-store/);
    assert.equal((await (await request("preferences")).json()).values.addressCity, "Lviv");
    const submitted = await request("seller-application", { method: "POST", body: JSON.stringify({ companyName: "Fixture company", storeName: "Fixture store", taxNumber: "12345678" }) });
    assert.equal((await submitted.json()).status, "pending");
    assert.equal((await (await request("seller-application")).json()).application.companyName, "Fixture company");
    assert.equal((await (await request("orders?page=1&search=ORDER")).json()).totalElements, 1);
    assert.equal((await (await request("notifications")).json()).unreadCount, 1);
    const read = await request("notifications/read", { method: "POST", body: JSON.stringify({ keys: [notification.key] }) });
    assert.equal(read.status, 204); assert.equal(await read.text(), "");
    assert.equal((await (await request("notifications")).json()).unreadCount, 0);
    assert.equal((await request("preferences", { method: "PATCH", headers: { Origin: "https://outside.test" }, body: "{}" })).status, 403);
    for (const path of ["users", "orders/not-a-guid", "notifications/read"]) assert.equal((await request(path)).status, 404);
    assert.equal((await request("orders", { method: "POST", body: "{}" })).status, 404);
  });
  await t.test("login returns every authoritative workspace role without granting a submitted role", async () => {
    for (const role of ["Administrator", "Manager", "Moderator", "Seller"]) {
      const response = await post("/shop-api/session", { action: "login", email: role + "@example.test", password: "fixture-only" });
      assert.equal(response.status, 200);
      const result = await response.json(); assert.equal(result.user.role, role); assert.ok(!("accessToken" in result));
      assert.ok(response.headers.getSetCookie().some(value => value.startsWith("treba_staff_access=fixture-staff;") && /Path=\//i.test(value) && /HttpOnly/i.test(value)));
      assert.ok(!response.headers.getSetCookie().some(value => value.startsWith("treba_access=fixture-staff;")));
      const staffCookie = cookieJar(response);
      assert.equal((await fetch(origin + "/shop-api/session", { headers: { Cookie: staffCookie } })).status, 401);
      assert.equal((await fetch(origin + "/shop-api/account/preferences", { headers: { Cookie: staffCookie } })).status, 401);
      assert.equal((await post("/shop-api/orders", {}, staffCookie)).status, 401);
    }
    const forged = await post("/shop-api/session", { action: "login", email: "customer@example.test", password: "fixture-only", role: "Administrator" });
    assert.equal((await forged.json()).user.role, "Customer");
  });
  await t.test("email and authenticator return the verified role only after a valid code", async () => {
    const email = await post("/shop-api/session", { action: "email", challengeId: "fixture-challenge" });
    assert.equal(email.status, 200); assert.equal(email.headers.getSetCookie().length, 0);
    for (const method of ["email", "authenticator"]) {
      const invalid = await post("/shop-api/session", { action: "verify", challengeId: "fixture-challenge", method, code: "000000" });
      assert.equal(invalid.status, 401); assert.equal(invalid.headers.getSetCookie().length, 0);
      const verified = await post("/shop-api/session", { action: "verify", challengeId: "fixture-challenge", method, code: "123456" });
      assert.equal(verified.status, 200); assert.equal((await verified.json()).user.role, "Manager");
      assert.ok(verified.headers.getSetCookie().length > 0);
    }
  });
  await t.test("connected methods do not establish a session before verification", async () => {
    const pending = await post("/shop-api/session", { action: "login", email: "challenge@example.test", password: "fixture-only" });
    assert.equal(pending.headers.getSetCookie().length, 0); assert.deepEqual((await pending.json()).challenge.methods, ["authenticator", "email", "telegram"]);
    assert.equal((await post("/shop-api/session", { action: "guard-start" })).status, 400);
    const started = await post("/shop-api/session", { action: "guard-start", challengeId: "fixture-challenge" }); const guard = await started.json(); assert.equal(guard.displayCode, "123456"); assert.equal(started.headers.getSetCookie().length, 0);
    const status = await post("/shop-api/session", { action: "guard-status", id: guard.id, browserSecret: guard.browserSecret }); assert.equal((await status.json()).status, "approved");
    const verified = await post("/shop-api/session", { action: "guard-complete", id: guard.id, browserSecret: guard.browserSecret }); const result = await verified.text(); assert.ok(result.includes('"role":"Manager"')); assert.ok(!result.includes("fixture-staff")); assert.ok(verified.headers.getSetCookie().length > 0);
  });
  await t.test("legacy admin entry redirects to the integrated workspace without credentials", async () => {
    const response = await fetch(origin + "/shop-api/admin-entry", { redirect: "manual" });
    assert.equal(response.status, 307); assert.equal(response.headers.get("location"), "/admin"); assert.match(response.headers.get("cache-control"), /no-store/);
  });
  await t.test("legacy staff sessions are cleared instead of becoming a customer profile", async () => {
    const legacy = `treba_access=fixture-staff; treba_refresh=fixture-refresh; treba_expiry=${encodeURIComponent(new Date(Date.now() + 600000).toISOString())}`;
    const response = await fetch(origin + "/shop-api/session", { headers: { Cookie: legacy } });
    assert.equal(response.status, 403); assert.deepEqual(await response.json(), { user: null });
    assert.ok(response.headers.getSetCookie().filter(value => /Max-Age=0/i.test(value)).length >= 4);
  });
  await t.test("returning from admin ends the website session and accepts only the admin origin", async () => {
    assert.equal((await fetch(origin + "/shop-api/staff-exit")).status, 405);
    const invalid = await post("/shop-api/staff-exit", {}, cookie, "https://untrusted.example"); assert.equal(invalid.status, 403); assert.equal(invalid.headers.getSetCookie().length, 0);
    const response = await fetch(origin + "/shop-api/staff-exit", { method: "POST", redirect: "manual", headers: { Origin: "https://admin.treba.duckdns.org", Cookie: cookie } });
    assert.equal(response.status, 303); assert.equal(response.headers.get("location"), "/");
    for (const name of ["treba_access", "treba_refresh", "treba_expiry", "treba_remember", "treba_staff_handoff"])
      assert.ok(response.headers.getSetCookie().some(value => value.startsWith(name + "=;") && /Max-Age=0/i.test(value)));
  });
  await t.test("concurrent requests share one rotating refresh", async () => {
    const expired = await post("/shop-api/session", { action: "login", email: "expired@example.test", password: "fixture-only" }); const oldCookie = cookieJar(expired);
    const responses = await Promise.all([fetch(origin + "/shop-api/session", { headers: { Cookie: oldCookie } }), fetch(origin + "/shop-api/support", { headers: { Cookie: oldCookie } })]);
    assert.ok(responses.every(response => response.status === 200)); assert.equal(refreshCount, 1);
  });
  await t.test("logout removes session cookies", async () => {
    const response = await post("/shop-api/session", { action: "logout" }, cookie); assert.equal(response.status, 200); assert.ok(response.headers.getSetCookie().every(value => /Max-Age=0/i.test(value)));
  });
});
