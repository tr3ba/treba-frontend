import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

test("support session uses real server authentication without exposing credentials", { timeout: 120000 }, async t => {
  let refreshCount = 0;
  const authentication = (expired = false, staff = false) => ({ userId: "fixture-customer", firstName: "Test", lastName: "Customer", email: "customer@example.test", role: staff ? "Manager" : "Customer", accessToken: staff ? "fixture-staff" : "fixture-access", refreshToken: "fixture-refresh", expiresAt: new Date(Date.now() + (expired ? -1000 : 3600000)).toISOString() });
  const backend = http.createServer(async (request, response) => {
    let body = ""; for await (const part of request) body += part;
    response.setHeader("Content-Type", "application/json");
    if (request.url === "/api/auth/login") {
      if (body.includes("challenge")) { response.end(JSON.stringify({ challenge: { challengeId: "fixture-challenge", methods: ["authenticator", "email", "telegram"], maskedEmail: "t***@example.test", expiresAt: new Date(Date.now() + 60000).toISOString() } })); return; }
      response.end(JSON.stringify({ authentication: authentication(body.includes("expired"), body.includes("staff")) })); return;
    }
    if (request.url === "/api/telegram/guard") { assert.equal(JSON.parse(body).loginChallengeId, "fixture-challenge"); response.end(JSON.stringify({ id: "fixture-guard", browserSecret: "fixture-browser-secret", qrCodeDataUrl: "data:image/png;base64,fixture", displayCode: "123456" })); return; }
    if (request.url === "/api/telegram/guard/status") { assert.equal(JSON.parse(body).browserSecret, "fixture-browser-secret"); response.end(JSON.stringify({ status: "approved" })); return; }
    if (request.url === "/api/telegram/guard/complete") { assert.equal(JSON.parse(body).browserSecret, "fixture-browser-secret"); response.end(JSON.stringify({ authentication: authentication(false, true) })); return; }
    if (request.url === "/api/auth/register") { assert.equal(JSON.parse(body).roleName, "Customer"); response.end(JSON.stringify(authentication())); return; }
    if (request.url === "/api/auth/refresh") { refreshCount++; await delay(100); response.end(JSON.stringify(authentication())); return; }
    if (!["Bearer fixture-access", "Bearer fixture-staff"].includes(request.headers.authorization)) { response.writeHead(401); response.end("{}"); return; }
    if (request.url === "/api/auth/admin-entry") { if (request.headers.authorization !== "Bearer fixture-staff") response.writeHead(403); response.end(JSON.stringify({ code: "one-time-admin-code", expiresAt: new Date(Date.now() + 60000).toISOString() })); return; }
    if (request.url === "/api/users/me") { response.end(JSON.stringify({ id: "fixture-customer", firstName: "Test", lastName: "Customer", email: "customer@example.test", phone: "+380000000000", role: request.headers.authorization === "Bearer fixture-staff" ? "Manager" : "Customer" })); return; }
    if (request.url === "/api/auth/logout") { response.writeHead(204); response.end(); return; }
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
    for (const value of response.headers.getSetCookie()) { assert.match(value, /HttpOnly/i); assert.match(value, /SameSite=lax/i); assert.match(value, /Path=\/shop-api/i); }
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
    assert.equal(response.status, 200); assert.ok(response.headers.getSetCookie().every(value => !/Max-Age=/i.test(value)));
  });
  await t.test("connected methods do not establish a session before verification", async () => {
    const pending = await post("/shop-api/session", { action: "login", email: "challenge@example.test", password: "fixture-only" });
    assert.equal(pending.headers.getSetCookie().length, 0); assert.deepEqual((await pending.json()).challenge.methods, ["authenticator", "email", "telegram"]);
    assert.equal((await post("/shop-api/session", { action: "guard-start" })).status, 400);
    const started = await post("/shop-api/session", { action: "guard-start", challengeId: "fixture-challenge" }); const guard = await started.json(); assert.equal(guard.displayCode, "123456"); assert.equal(started.headers.getSetCookie().length, 0);
    const status = await post("/shop-api/session", { action: "guard-status", id: guard.id, browserSecret: guard.browserSecret }); assert.equal((await status.json()).status, "approved");
    const verified = await post("/shop-api/session", { action: "guard-complete", id: guard.id, browserSecret: guard.browserSecret }); const result = await verified.text(); assert.ok(result.includes('"role":"Manager"')); assert.ok(!result.includes("fixture-staff")); assert.ok(verified.headers.getSetCookie().length > 0);
  });
  await t.test("admin entry checks the staff role and only redirects with a temporary code", async () => {
    const state = "A".repeat(64); const path = "/shop-api/admin-entry?state=" + state;
    assert.equal((await fetch(origin + "/shop-api/admin-entry", { redirect: "manual" })).status, 400);
    const anonymous = await fetch(origin + path, { redirect: "manual", headers: { "X-Forwarded-Host": "treba.duckdns.org", "X-Forwarded-Proto": "https" } });
    assert.equal(anonymous.status, 307);
    const anonymousLocation = anonymous.headers.get("location"); assert.ok(anonymousLocation.startsWith("/login?"));
    const publicLogin = new URL(anonymousLocation, "https://treba.duckdns.org");
    assert.equal(publicLogin.origin, "https://treba.duckdns.org"); assert.equal(publicLogin.pathname, "/login");
    assert.equal(publicLogin.searchParams.get("next"), path); assert.match(anonymous.headers.get("cache-control"), /no-store/);
    assert.equal((await fetch(origin + path, { headers: { Cookie: cookie }, redirect: "manual" })).status, 403);
    const login = await post("/shop-api/session", { action: "login", email: "staff@example.test", password: "fixture-only" }); const staff = cookieJar(login);
    const profile = await fetch(origin + "/shop-api/session", { headers: { Cookie: staff } }); assert.equal((await profile.json()).user.role, "Manager");
    const handoff = await fetch(origin + path, { headers: { Cookie: staff }, redirect: "manual" }); assert.equal(handoff.status, 307);
    const target = new URL(handoff.headers.get("location")); assert.equal(target.origin, "https://admin.treba.duckdns.org"); assert.equal(target.pathname, "/site-login/callback"); assert.equal(target.searchParams.get("state"), state); assert.equal(target.searchParams.get("code"), "one-time-admin-code");
    assert.ok(!target.href.includes("fixture-staff")); assert.equal(handoff.headers.get("referrer-policy"), "no-referrer"); assert.match(handoff.headers.get("cache-control"), /no-store/);
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
