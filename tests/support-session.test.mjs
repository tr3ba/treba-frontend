import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

test("support session uses real server authentication without exposing credentials", { timeout: 120000 }, async t => {
  let refreshCount = 0;
  const authentication = (expired = false) => ({ userId: "fixture-customer", firstName: "Test", lastName: "Customer", email: "customer@example.test", accessToken: "fixture-access", refreshToken: "fixture-refresh", expiresAt: new Date(Date.now() + (expired ? -1000 : 3600000)).toISOString() });
  const backend = http.createServer(async (request, response) => {
    let body = ""; for await (const part of request) body += part;
    response.setHeader("Content-Type", "application/json");
    if (request.url === "/api/auth/login") { response.end(JSON.stringify({ authentication: authentication(body.includes("expired")) })); return; }
    if (request.url === "/api/auth/register") { assert.equal(JSON.parse(body).roleName, "Customer"); response.end(JSON.stringify(authentication())); return; }
    if (request.url === "/api/auth/refresh") { refreshCount++; await delay(100); response.end(JSON.stringify(authentication())); return; }
    if (request.headers.authorization !== "Bearer fixture-access") { response.writeHead(401); response.end("{}"); return; }
    if (request.url === "/api/users/me") { response.end(JSON.stringify({ id: "fixture-customer", firstName: "Test", lastName: "Customer", email: "customer@example.test", phone: "+380000000000" })); return; }
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
  await t.test("concurrent requests share one rotating refresh", async () => {
    const expired = await post("/shop-api/session", { action: "login", email: "expired@example.test", password: "fixture-only" }); const oldCookie = cookieJar(expired);
    const responses = await Promise.all([fetch(origin + "/shop-api/session", { headers: { Cookie: oldCookie } }), fetch(origin + "/shop-api/support", { headers: { Cookie: oldCookie } })]);
    assert.ok(responses.every(response => response.status === 200)); assert.equal(refreshCount, 1);
  });
  await t.test("logout removes session cookies", async () => {
    const response = await post("/shop-api/session", { action: "logout" }, cookie); assert.equal(response.status, 200); assert.ok(response.headers.getSetCookie().every(value => /Max-Age=0/i.test(value)));
  });
});
